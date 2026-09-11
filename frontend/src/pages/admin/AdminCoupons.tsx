import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState({
    code: '', discountPercentage: '', fixedDiscount: '', minBookingAmount: '0',
    maxDiscount: '', expiryDate: '', usageLimit: '0', perUserLimit: '1',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => adminService.coupons.list().then(setCoupons);
  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      ['discountPercentage', 'fixedDiscount', 'minBookingAmount', 'maxDiscount', 'usageLimit', 'perUserLimit'].forEach((k) => {
        if (form[k as keyof typeof form] === '') delete payload[k];
        else payload[k] = Number(form[k as keyof typeof form]);
      });
      await adminService.coupons.create(payload);
      toast.success('Coupon created.');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not create coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    await adminService.coupons.remove(id);
    toast.success('Coupon removed.');
    load();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Coupons</h1>

      <form onSubmit={submit} className="card mb-6 grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        <input className="input" placeholder="CODE" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
        <input className="input" placeholder="Discount %" value={form.discountPercentage} onChange={(e) => setForm((f) => ({ ...f, discountPercentage: e.target.value }))} />
        <input className="input" placeholder="Fixed discount ₹" value={form.fixedDiscount} onChange={(e) => setForm((f) => ({ ...f, fixedDiscount: e.target.value }))} />
        <input className="input" placeholder="Min booking amount" value={form.minBookingAmount} onChange={(e) => setForm((f) => ({ ...f, minBookingAmount: e.target.value }))} />
        <input className="input" placeholder="Max discount ₹" value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} />
        <input className="input" type="date" required value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
        <input className="input" placeholder="Usage limit (0=unlimited)" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
        <input className="input" placeholder="Per-user limit" value={form.perUserLimit} onChange={(e) => setForm((f) => ({ ...f, perUserLimit: e.target.value }))} />
        <button className="btn-primary sm:col-span-4" disabled={submitting}><Plus className="h-4 w-4" /> Create coupon</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr><th className="p-4">Code</th><th className="p-4">Discount</th><th className="p-4">Expiry</th><th className="p-4">Used</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c._id} className="border-b border-gray-50">
                <td className="p-4 font-mono font-semibold">{c.code}</td>
                <td className="p-4">{c.discountPercentage ? `${c.discountPercentage}%` : `₹${c.fixedDiscount}`}</td>
                <td className="p-4">{new Date(c.expiryDate).toLocaleDateString()}</td>
                <td className="p-4">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                <td className="p-4"><button onClick={() => remove(c._id)}><Trash2 className="h-4 w-4 text-red-500" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
