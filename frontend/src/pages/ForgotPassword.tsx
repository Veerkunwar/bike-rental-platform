import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card w-full max-w-md p-6">
        <h1 className="mb-4 text-xl font-bold">Reset your password</h1>
        {sent ? (
          <p className="text-sm text-gray-600">If that email is registered, a reset link has been sent. Check your inbox.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
