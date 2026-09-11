import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supportService } from '../services/supportService';
import { StatusBadge } from '../components/StatusBadge';

const CATEGORIES = ['payment', 'booking', 'bike', 'refund', 'document', 'other'];

export default function Support() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [form, setForm] = useState({ category: 'booking', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => supportService.myTickets().then(setTickets);
  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supportService.create(form);
      toast.success('Support ticket created.');
      setForm({ category: 'booking', subject: '', message: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">Support</h1>

      <form onSubmit={submit} className="card mb-8 space-y-4 p-6">
        <h2 className="font-bold">Raise a new ticket</h2>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Subject</label>
          <input className="input" required value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="input" rows={4} required value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
        </div>
        <button className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit ticket'}</button>
      </form>

      <h2 className="mb-3 font-bold">My tickets</h2>
      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t._id} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{t.subject}</p>
              <StatusBadge status={t.status} />
            </div>
            <p className="text-xs capitalize text-gray-500">{t.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
