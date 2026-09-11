import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bike } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', dateOfBirth: '', city: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please verify your email and documents.');
      navigate('/profile/documents');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center">
          <Bike className="h-10 w-10 text-brand-600" />
          <h1 className="mt-3 text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-gray-500">Explore new cities on two wheels</p>
        </div>
        <form onSubmit={onSubmit} className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Full name</label>
            <input className="input" required value={form.fullName} onChange={update('fullName')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={update('email')} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" required value={form.phone} onChange={update('phone')} placeholder="+91..." />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={8} value={form.password} onChange={update('password')} />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input className="input" type="password" required value={form.confirmPassword} onChange={update('confirmPassword')} />
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input className="input" type="date" value={form.dateOfBirth} onChange={update('dateOfBirth')} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" value={form.city} onChange={update('city')} placeholder="Dehradun" />
          </div>
          <button className="btn-primary sm:col-span-2" disabled={loading}>{loading ? 'Creating account...' : 'Sign up'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="font-medium text-brand-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
