import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); return; }
    authService.verifyEmail(token).then(() => setStatus('ok')).catch(() => setStatus('error'));
  }, [params]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
      <div className="card max-w-md p-8">
        {status === 'loading' && <p>Verifying your email...</p>}
        {status === 'ok' && (
          <>
            <h1 className="mb-2 text-xl font-bold text-emerald-600">Email verified!</h1>
            <p className="mb-4 text-sm text-gray-600">Your email has been successfully verified.</p>
            <Link to="/login" className="btn-primary">Continue to login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="mb-2 text-xl font-bold text-red-600">Verification failed</h1>
            <p className="text-sm text-gray-600">This link is invalid or has expired.</p>
          </>
        )}
      </div>
    </div>
  );
}
