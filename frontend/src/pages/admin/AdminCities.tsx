import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminCities() {
  const [cities, setCities] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', state: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => adminService.cities.list().then(setCities);
  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.cities.create(form);
      toast.success('City added.');
      setForm({ name: '', state: '', description: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not add city.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this city?')) return;
    await adminService.cities.remove(id);
    toast.success('City removed.');
    load();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Cities & Locations</h1>

      <form onSubmit={submit} className="card mb-6 flex flex-wrap items-end gap-3 p-5">
        <div><label className="label">City name</label><input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
        <div><label className="label">State</label><input className="input" required value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} /></div>
        <div className="flex-1"><label className="label">Description</label><input className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
        <button className="btn-primary" disabled={submitting}><Plus className="h-4 w-4" /> Add city</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr><th className="p-4">Name</th><th className="p-4">State</th><th className="p-4">Popularity</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody>
            {cities.map((c) => (
              <tr key={c._id} className="border-b border-gray-50">
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4">{c.state}</td>
                <td className="p-4">{c.popularity}</td>
                <td className="p-4"><span className={`badge ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="p-4"><button onClick={() => remove(c._id)}><Trash2 className="h-4 w-4 text-red-500" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">Add rental locations for a city from the Bikes form, or extend this page with a Locations sub-table using adminService (createLocation is already wired on the backend).</p>
    </div>
  );
}
