import { useEffect } from 'react';
import { getUserManager } from '../auth/userManager';

export default function CallbackPage() {
  useEffect(() => {
    getUserManager().signinPopupCallback();
  }, []);

  return null;
}
