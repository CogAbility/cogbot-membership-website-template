import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import OnboardingProgressIndicator from '../components/OnboardingProgressIndicator';
import { emptyChild, FormField, fieldClass, ChildForm } from '../components/ProfileFormFields';
import { sendAuthenticatedMessage, buildOnboardingMessage } from '../services/buddyApi';
import config from '@/site.config';

const { onboarding: c } = config;

const STEPS = [c.step1Label, c.step2Label, c.step3Label];

// ── Step 1: Parent Info ──────────────────────────────────────────────────────

function StepYourInfo({ data, onChange, onNext, onSkip }) {
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!data.firstName.trim()) e.firstName = 'First name is required.';
    return e;
  }

  function handleNext() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-foreground">{c.step1Heading}</h2>
        <p className="text-muted-foreground text-sm mt-1">{c.step1Sub}</p>
      </div>

      <div className="space-y-4">
        <FormField
          label="First name"
          required
          error={errors.firstName}
        >
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange({ ...data, firstName: e.target.value })}
            placeholder="Your first name"
            className={fieldClass(errors.firstName)}
            autoFocus
          />
        </FormField>

        <FormField label="Last name">
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange({ ...data, lastName: e.target.value })}
            placeholder="Your last name (optional)"
            className={fieldClass()}
          />
        </FormField>
      </div>

      <StepActions onNext={handleNext} onSkip={onSkip} showBack={false} />
    </div>
  );
}

// ── Step 2: Baby Info ────────────────────────────────────────────────────────

function StepBabyInfo({ data, onChange, onNext, onBack, onSkip }) {
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    data.forEach((child, i) => {
      if (!child.name.trim()) e[`name_${i}`] = 'Child name is required.';
    });
    return e;
  }

  function handleNext() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    onNext();
  }

  function updateChild(index, field, value) {
    const updated = data.map((child, i) =>
      i === index ? { ...child, [field]: value } : child
    );
    onChange(updated);
  }

  function addChild() {
    onChange([...data, emptyChild()]);
  }

  function removeChild(index) {
    onChange(data.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-foreground">{c.step2Heading}</h2>
        <p className="text-muted-foreground text-sm mt-1">{c.step2Sub}</p>
      </div>

      <div className="space-y-6">
        {data.map((child, index) => (
          <ChildForm
            key={index}
            index={index}
            child={child}
            errors={errors}
            showRemove={data.length > 1}
            onChange={(field, value) => updateChild(index, field, value)}
            onRemove={() => removeChild(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addChild}
        className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
      >
        {c.addChildLabel}
      </button>

      <StepActions onNext={handleNext} onBack={onBack} onSkip={onSkip} />
    </div>
  );
}

// ── Step 3: All Set ──────────────────────────────────────────────────────────

function StepAllSet({ parentData, childrenData, onComplete, onBack }) {
  const fullName = [parentData.firstName, parentData.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-foreground">{c.completeHeading}</h2>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">{c.completeSubheading}</p>
      </div>

      {/* Summary */}
      <div className="card space-y-3">
        <h3 className="font-bold text-foreground text-sm">Your profile</h3>
        {fullName && (
          <div className="text-sm">
            <span className="text-muted-foreground">Name: </span>
            <span className="text-foreground font-semibold">{fullName}</span>
          </div>
        )}
        {childrenData.map((child, i) => (
          <div key={i} className="text-sm">
            <span className="text-muted-foreground">
              {childrenData.length > 1 ? `Child ${i + 1}: ` : 'Child: '}
            </span>
            <span className="text-foreground font-semibold">
              {child.name}
              {child.gender ? ` (${child.gender})` : ''}
              {child.birthMonth && child.birthDay && child.birthYear
                ? `, born ${child.birthMonth} ${child.birthDay}, ${child.birthYear}`
                : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onComplete}
          className="btn-primary w-full py-3"
        >
          {c.completeButtonLabel}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground font-semibold transition-colors text-center"
        >
          Back
        </button>
      </div>
    </div>
  );
}

// ── Shared UI pieces ─────────────────────────────────────────────────────────

function StepActions({ onNext, onBack, onSkip, showBack = true }) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      <button
        type="button"
        onClick={onNext}
        className="btn-primary w-full py-3"
      >
        Next
      </button>
      <div className="flex items-center justify-between">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground font-semibold transition-colors"
          >
            Back
          </button>
        ) : <span />}
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground font-semibold transition-colors"
        >
          {c.skipLabel}
        </button>
      </div>
    </div>
  );
}

// ── Main Onboarding Page ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [parentData, setParentData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [childrenData, setChildrenData] = useState([emptyChild()]);

  function markOnboardingComplete() {
    if (user?.uid) {
      localStorage.setItem(`onboarded_${user.uid}`, '1');
    }
  }

  function persistProfileLocally() {
    if (user?.uid) {
      localStorage.setItem(`profile_parent_${user.uid}`, JSON.stringify(parentData));
      localStorage.setItem(`profile_children_${user.uid}`, JSON.stringify(childrenData));
    }
  }

  const goToMembers = useCallback(() => {
    markOnboardingComplete();
    navigate('/members', { replace: true });
  }, [navigate, user?.uid]);

  async function handleComplete() {
    markOnboardingComplete();
    persistProfileLocally();
    // Fire-and-forget — don't block navigation on the cascade response
    const message = buildOnboardingMessage(parentData, childrenData);
    sendAuthenticatedMessage(message, { idToken: user?.idToken }).catch((err) => {
      console.error('Onboarding: failed to save profile', err);
    });
    navigate('/members', { replace: true });
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background px-4 py-12">
      <div className="bg-card rounded-2xl shadow-xl border border-border p-8 sm:p-10 w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-lg font-black text-foreground">{c.welcomeHeading}</h1>
          <p className="text-muted-foreground text-sm mt-1">{c.welcomeSubheading}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <OnboardingProgressIndicator steps={STEPS} currentStep={step} />
        </div>

        {/* Step content */}
        {step === 1 && (
          <StepYourInfo
            data={parentData}
            onChange={setParentData}
            onNext={() => setStep(2)}
            onSkip={goToMembers}
          />
        )}
        {step === 2 && (
          <StepBabyInfo
            data={childrenData}
            onChange={setChildrenData}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            onSkip={goToMembers}
          />
        )}
        {step === 3 && (
          <StepAllSet
            parentData={parentData}
            childrenData={childrenData}
            onComplete={handleComplete}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}
