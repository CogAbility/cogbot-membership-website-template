import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function AccessDenied({ reason }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background px-4 py-12">
      <div className="bg-card rounded-2xl shadow-xl border border-border p-8 sm:p-10 w-full max-w-md text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-foreground mb-2">Access Restricted</h1>

        {user && (
          <p className="text-xs text-muted-foreground mb-4">Signed in as {user.email}</p>
        )}

        <p className="text-muted-foreground text-xs sm:text-sm mb-8 leading-relaxed">
          {reason || 'You do not have permission to view this page. Please contact an administrator if you believe this is a mistake.'}
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/" className="btn-primary w-full text-center py-3">
            Return to Home
          </Link>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-full border-2 border-primary text-primary font-bold text-sm transition-all duration-200 hover:bg-primary hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
