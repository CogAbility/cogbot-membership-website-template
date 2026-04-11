import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function CallbackPage() {
  const { handleCallback } = useAuth();
  const calledRef = useRef(false);
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    handleCallback().then((success) => {
      const returnTo = sessionStorage.getItem('auth_return_to') || '/members';
      sessionStorage.removeItem('auth_return_to');
      setRedirectTo(success ? returnTo : '/');
    });
  }, [handleCallback]);

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Completing sign-in...</p>
      </div>
    </div>
  );
}
