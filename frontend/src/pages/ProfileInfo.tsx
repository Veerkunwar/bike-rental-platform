import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function ProfileInfo() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    city: user?.city || '',
    address: '',
    emergencyContact: '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/me', form);
      toast.success('Profile updated.');
      await refreshUser();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
      <div><label className="label">Full name</label><input className="input" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></div>
      <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
      <div><label className="label">Email</label><input className="input" value={user?.email} disabled /></div>
      <div><label className="label">City</label><input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
      <div className="sm:col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
      <div><label className="label">Emergency contact</label><input className="input" value={form.emergencyContact} onChange={(e) => setForm((f) => ({ ...f, emergencyContact: e.target.value }))} /></div>
      <button className="btn-primary sm:col-span-2" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save changes'}</button>
    </div>
  );
}
