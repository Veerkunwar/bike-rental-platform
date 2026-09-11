import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

export default function AdminRefunds() {
  const [form, setForm] = useState({ bookingId: '', amount: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.payments.refund({ bookingId: form.bookingId, amount: Number(form.amount), reason: form.reason });
      toast.success('Refund processed.');
      setForm({ bookingId: '', amount: '', reason: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Refund failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Process a Refund</h1>
      <form onSubmit={submit} className="card max-w-lg space-y-4 p-6">
        <div>
          <label className="label">Booking ID (Mongo _id)</label>
          <input className="input" required value={form.bookingId} onChange={(e) => setForm((f) => ({ ...f, bookingId: e.target.value }))} />
        </div>
        <div>
          <label className="label">Refund amount (₹)</label>
          <input className="input" type="number" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
        </div>
        <div>
          <label className="label">Reason</label>
          <textarea className="input" required value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
        </div>
        <button className="btn-primary" disabled={submitting}>{submitting ? 'Processing...' : 'Process refund'}</button>
      </form>
    </div>
  );
}
