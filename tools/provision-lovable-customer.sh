#!/usr/bin/env bash
# provision-lovable-customer.sh — CogAbility ops onboarding for a new Lovable customer.
#
# Adds a customer's site origin to all CogAbility allowlists so the SDK
# integration in their Lovable site can reach CAM, CMG, and App ID, and so the
# cogbot recognises their host.
#
# This script is OPS-ONLY. It requires:
#   - AWS SSO session against the production account (`aws sso login`)
#   - kubectl context for the mc-cap1 EKS cluster (auto-set below)
#   - jq, curl, base64
#
# Usage:
#   tools/provision-lovable-customer.sh https://acme-membership.lovable.app
#
# Optional flags:
#   --skip-cam       Skip Mutation 1 (CAM CORS Cloudant)
#   --skip-cmg       Skip Mutation 2 (CMG ALLOWED_ORIGINS k8s)
#   --no-restart     Don't roll the CAM/CMG deployments after mutating
#   --aws-profile P  Override the AWS profile (default: cogability-admin)
#   --cluster-arn A  Override the EKS cluster ARN (default: production-us-east-2)
#
# What this script automates:
#   1. CAM CORS whitelist (Cloudant doc cors-whitelist/CogBotV2-CAP1)
#   2. CMG ALLOWED_ORIGINS (k8s secret cmg-secrets in mc-cap1 namespace)
#   3. Restart cam-manager and cmg deployments to flush caches
#   4. Verifies preflight CORS responses end-to-end
#
# What this script CANNOT automate (must be done manually by ops):
#   3. App ID web redirect URLs — IBM Cloud console only, no public API
#      → Add `<origin>/callback` to the App ID app's redirect URLs
#
#   4. Cogbot major config — depends on where the cogbot config lives for
#      your tenant; usually the Cloudant doc `major/<namespace>` in the
#      `cogability` database
#      → Add the origin's bare hostname (e.g. `acme.lovable.app` — no
#        protocol, no trailing slash) to BOTH host-allowlist fields:
#          a. context_boosting_config[*].conditions[*].$or[*]
#                                .cap_host_url.$contains   (drives chat replies)
#          b. welcome_message_config[*].conditions[*].$and[*]
#                                .cap_host_url.$contains   (drives the greeting)
#        Adding to one does NOT add to the other. They are independent.
#      → Then restart BOTH cam-manager AND pfc2 (pfc2 generates greetings
#        and caches the major config in-process — most common cause of
#        "I added the host but greeting is still empty"). The script
#        will offer to do these restarts for you at the end.
#
# The script will print a checklist of these manual steps at the end.

set -euo pipefail

# --- Defaults -------------------------------------------------------------

AWS_PROFILE_DEFAULT="cogability-admin"
CLUSTER_ARN_DEFAULT="arn:aws:eks:us-east-2:001862660410:cluster/production-us-east-2"
CMG_NAMESPACE="mc-cap1"
CAM_DEPLOYMENT="cam-manager"
CMG_DEPLOYMENT="cmg"
CMG_SECRET="cmg-secrets"
CAM_SECRET="cam-manager-secrets"
SM_SECRET_ID="/mc-cap1/secrets"  # AWS Secrets Manager — used only for IAM apikey discovery
CAM_HOST_PUBLIC="https://cam.mc-cap1.cogability.net"
CMG_HOST_PUBLIC="https://cmg.mc-cap1.cogability.net"

SKIP_CAM=0
SKIP_CMG=0
NO_RESTART=0
AWS_PROFILE_FLAG=""
CLUSTER_ARN_FLAG=""

# --- Arg parsing ----------------------------------------------------------

ORIGIN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-cam) SKIP_CAM=1; shift ;;
    --skip-cmg) SKIP_CMG=1; shift ;;
    --no-restart) NO_RESTART=1; shift ;;
    --aws-profile) AWS_PROFILE_FLAG="$2"; shift 2 ;;
    --cluster-arn) CLUSTER_ARN_FLAG="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    https://*)
      if [[ -n "$ORIGIN" ]]; then
        echo "ERROR: only one origin URL allowed (got '$ORIGIN' and '$1')" >&2
        exit 1
      fi
      ORIGIN="$1"
      shift
      ;;
    *)
      echo "ERROR: unknown argument '$1'. Use --help for usage." >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ORIGIN" ]]; then
  echo "ERROR: must supply the customer's site origin (e.g. https://acme.lovable.app)" >&2
  echo "Usage: $0 https://<slug>.lovable.app" >&2
  exit 1
fi

# Strip trailing slash for consistency
ORIGIN="${ORIGIN%/}"

# Basic origin validation
if ! [[ "$ORIGIN" =~ ^https://[a-zA-Z0-9.-]+(:[0-9]+)?$ ]]; then
  echo "ERROR: origin must be 'https://host[:port]' with no path/query (got '$ORIGIN')" >&2
  exit 1
fi

export AWS_PROFILE="${AWS_PROFILE_FLAG:-$AWS_PROFILE_DEFAULT}"
CLUSTER_ARN="${CLUSTER_ARN_FLAG:-$CLUSTER_ARN_DEFAULT}"

# --- Tool checks ----------------------------------------------------------

for cmd in aws kubectl jq curl base64; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: required tool '$cmd' not found in PATH" >&2
    exit 1
  fi
done

# --- AWS auth check -------------------------------------------------------

echo "==> Verifying AWS credentials (profile=$AWS_PROFILE)"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "  AWS credentials missing or expired."
  echo "  Run: aws sso login --profile $AWS_PROFILE"
  exit 1
fi
echo "  OK"

# --- kubectl context ------------------------------------------------------

if [[ $SKIP_CMG -eq 0 ]]; then
  echo "==> Switching kubectl context to $CLUSTER_ARN"
  kubectl config use-context "$CLUSTER_ARN" >/dev/null
  if ! kubectl get ns "$CMG_NAMESPACE" >/dev/null 2>&1; then
    echo "ERROR: namespace '$CMG_NAMESPACE' not visible to kubectl. Check cluster access." >&2
    exit 1
  fi
  echo "  OK"
fi

# --- Mutation 1: CAM CORS (Cloudant) -------------------------------------

if [[ $SKIP_CAM -eq 0 ]]; then
  echo "==> Mutation 1: CAM CORS whitelist (Cloudant)"
  echo "  Reading Cloudant credentials from k8s secret $CAM_SECRET (namespace $CMG_NAMESPACE)"
  CLOUDANT_URL=$(kubectl get secret "$CAM_SECRET" -n "$CMG_NAMESPACE" -o jsonpath='{.data.CLOUDANT_URL}' | base64 -d)
  CLOUDANT_APIKEY=$(kubectl get secret "$CAM_SECRET" -n "$CMG_NAMESPACE" -o jsonpath='{.data.CLOUDANT_APIKEY}' | base64 -d)
  CORS_KEY=$(kubectl get secret "$CAM_SECRET" -n "$CMG_NAMESPACE" -o jsonpath='{.data.CORS_WHITELIST_KEY}' | base64 -d)
  if [[ -z "$CLOUDANT_URL" || -z "$CLOUDANT_APIKEY" || -z "$CORS_KEY" ]]; then
    echo "ERROR: failed to read Cloudant creds from $CAM_SECRET (URL/APIKEY/CORS_WHITELIST_KEY)" >&2
    exit 1
  fi

  echo "  Exchanging IBM Cloud apikey for IAM bearer token"
  TOKEN=$(curl -sf -X POST "https://iam.cloud.ibm.com/identity/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=$CLOUDANT_APIKEY" \
    | jq -r '.access_token')
  if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
    echo "ERROR: failed to obtain IAM token" >&2
    exit 1
  fi

  echo "  Reading current cors-whitelist/$CORS_KEY"
  DOC=$(curl -sf -H "Authorization: Bearer $TOKEN" "$CLOUDANT_URL/cors-whitelist/$CORS_KEY")
  REV=$(echo "$DOC" | jq -r '._rev')
  CURRENT_LEN=$(echo "$DOC" | jq '.whitelist | length')
  ALREADY=$(echo "$DOC" | jq --arg new "$ORIGIN" '.whitelist | index($new) != null')
  echo "  Current entries: $CURRENT_LEN (rev=$REV); already present: $ALREADY"

  if [[ "$ALREADY" == "true" ]]; then
    echo "  Origin already in CAM CORS whitelist — skipping PUT"
  else
    NEW_LIST=$(echo "$DOC" | jq --arg new "$ORIGIN" '.whitelist + [$new]')
    PUT_BODY=$(jq -n --arg rev "$REV" --argjson list "$NEW_LIST" '{_rev: $rev, whitelist: $list}')
    RESP=$(curl -sf -X PUT \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      "$CLOUDANT_URL/cors-whitelist/$CORS_KEY" \
      -d "$PUT_BODY")
    NEW_REV=$(echo "$RESP" | jq -r '.rev')
    echo "  PUT OK: $REV -> $NEW_REV ($((CURRENT_LEN + 1)) entries)"
  fi
fi

# --- Mutation 2: CMG ALLOWED_ORIGINS (k8s) -------------------------------

if [[ $SKIP_CMG -eq 0 ]]; then
  echo "==> Mutation 2: CMG ALLOWED_ORIGINS (k8s secret $CMG_SECRET)"
  CURRENT=$(kubectl get secret "$CMG_SECRET" -n "$CMG_NAMESPACE" -o jsonpath='{.data.ALLOWED_ORIGINS}' | base64 -d)
  echo "  Current: $CURRENT"
  if echo ",$CURRENT," | grep -q ",$ORIGIN,"; then
    echo "  Origin already in CMG ALLOWED_ORIGINS — skipping patch"
  else
    NEW="${CURRENT},${ORIGIN}"
    NEW="${NEW#,}"  # strip leading comma if CURRENT was empty
    ENCODED=$(printf '%s' "$NEW" | base64)
    kubectl patch secret "$CMG_SECRET" -n "$CMG_NAMESPACE" --type=json \
      -p="[{\"op\":\"replace\",\"path\":\"/data/ALLOWED_ORIGINS\",\"value\":\"$ENCODED\"}]" >/dev/null
    echo "  Patched: $NEW"
  fi
fi

# --- Restart deployments --------------------------------------------------

if [[ $NO_RESTART -eq 0 ]]; then
  if [[ $SKIP_CAM -eq 0 ]]; then
    echo "==> Restarting $CAM_DEPLOYMENT to flush CORS cache"
    kubectl rollout restart "deployment/$CAM_DEPLOYMENT" -n "$CMG_NAMESPACE" >/dev/null
    kubectl rollout status "deployment/$CAM_DEPLOYMENT" -n "$CMG_NAMESPACE" --timeout=180s
  fi
  if [[ $SKIP_CMG -eq 0 ]]; then
    echo "==> Restarting $CMG_DEPLOYMENT to pick up new ALLOWED_ORIGINS"
    kubectl rollout restart "deployment/$CMG_DEPLOYMENT" -n "$CMG_NAMESPACE" >/dev/null
    kubectl rollout status "deployment/$CMG_DEPLOYMENT" -n "$CMG_NAMESPACE" --timeout=180s
  fi
else
  echo "==> Skipping deployment restarts (--no-restart). CAM CORS cache refreshes within 5 minutes; CMG ALLOWED_ORIGINS requires pod restart to take effect."
fi

# --- Verify with preflights ----------------------------------------------

verify_preflight() {
  local label="$1" url="$2"
  local code aco
  code=$(curl -sS -o /dev/null -w "%{http_code}" \
    -X OPTIONS "$url" \
    -H "Origin: $ORIGIN" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: content-type")
  aco=$(curl -sS -D - -o /dev/null \
    -X OPTIONS "$url" \
    -H "Origin: $ORIGIN" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: content-type" \
    | awk -F': ' 'tolower($1) == "access-control-allow-origin" { sub(/\r$/, "", $2); print $2; exit }')
  if [[ "$code" == "204" || "$code" == "200" ]] && [[ "$aco" == "$ORIGIN" ]]; then
    echo "  $label: OK (HTTP $code, A-C-A-O: $aco)"
  else
    echo "  $label: FAIL (HTTP $code, A-C-A-O: '$aco')"
    return 1
  fi
}

echo "==> Verifying preflight CORS for $ORIGIN"
FAILED=0
[[ $SKIP_CAM -eq 0 ]] && verify_preflight "CAM" "$CAM_HOST_PUBLIC/v1/sessions" || FAILED=$((FAILED + $?))
[[ $SKIP_CMG -eq 0 ]] && verify_preflight "CMG" "$CMG_HOST_PUBLIC/auth/token"   || FAILED=$((FAILED + $?))

# --- Manual checklist -----------------------------------------------------

cat <<EOF

================================================================
Automated mutations complete for $ORIGIN.

MANUAL STEPS still required (no public APIs for these):

[1] App ID web redirect URLs
    - IBM Cloud console -> Resource list -> the App ID instance
    - Applications -> the application matching APPID_CLIENT_ID
    - Web redirect URLs: add
        $ORIGIN/callback
    - Save.

[2] Cogbot major config (TWO independent host allowlists)
    - Tenant-specific. For most CogAbility tenants the doc is
      'major/<namespace>' in the 'cogability' Cloudant database
      (e.g. 'major/bab_healthcare' for the BAB tenant).
    - In that doc, add the BARE HOSTNAME of $ORIGIN to BOTH:
        a. context_boosting_config[*].conditions[*].\$or[*]
                                  .cap_host_url.\$contains
           (drives chat replies — without it the bot returns empty
            text on every message)
        b. welcome_message_config[*].conditions[*].\$and[*]
                                  .cap_host_url.\$contains
           (drives the greeting endpoint — without it the chat opens
            with no welcome message)
      Bare hostname only — no protocol, no trailing slash. Example:
        '${ORIGIN#https://}'
      Adding to one does NOT add to the other. They are independent.
    - After the Cloudant doc is updated, restart BOTH deployments to
      flush their independent in-process caches:
        kubectl -n $CMG_NAMESPACE rollout restart deployment cam-manager
        kubectl -n $CMG_NAMESPACE rollout restart deployment pfc2
      Skipping the pfc2 restart is the #1 cause of "I added the host
      but the greeting is still empty" — the greeting is generated by
      pfc2, not cam-manager.

When the manual steps are done, the customer should be able to:
  - Open $ORIGIN/ and see/use the chat
  - Click Sign in -> complete OIDC -> land on /members
  - Sign in as a member and chat with the bot authenticated

If FAILED count above is non-zero or the customer reports issues,
re-run this script with -h for diagnostics options.
================================================================

EOF

exit "$FAILED"
