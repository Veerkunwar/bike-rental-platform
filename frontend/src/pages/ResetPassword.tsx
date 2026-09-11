import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.resetPassword(token, password, confirmPassword);
      toast.success('Password reset. Please log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4 p-6">
        <h1 className="text-xl font-bold">Set a new password</h1>
        <div>
          <label className="label">New password</label>
          <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input className="input" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Saving...' : 'Reset password'}</button>
      </form>
    </div>
  );
}
