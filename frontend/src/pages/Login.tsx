import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bike } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [email, setEmail] = useState('traveler@example.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Bike className="h-10 w-10 text-brand-600" />
          <h1 className="mt-3 text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-gray-500">Log in to book your next ride</p>
        </div>
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Link to="/forgot-password" className="mt-1 inline-block text-xs text-brand-600 hover:underline">Forgot password?</Link>
          </div>
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Don't have an account? <Link to="/register" className="font-medium text-brand-600 hover:underline">Sign up</Link>
        </p>
        <p className="mt-2 text-center text-xs text-gray-400">
          Demo account: traveler@example.com / Password123!
        </p>
      </div>
    </div>
  );
}
