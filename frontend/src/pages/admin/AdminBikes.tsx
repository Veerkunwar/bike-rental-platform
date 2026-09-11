import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { cityService, locationService } from '../../services/bikeService';
import { StatusBadge } from '../../components/StatusBadge';

const CATEGORIES = ['scooty', 'scooter', 'commuter', 'sports', 'cruiser', 'adventure', 'electric'];
const STATUSES = ['available', 'booked', 'rented', 'maintenance', 'disabled'];

export default function AdminBikes() {
  const [bikes, setBikes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({
    name: '', brand: '', modelName: '', manufacturingYear: '2024', category: 'commuter',
    engineCC: '', mileageKmpl: '', fuelType: 'petrol', transmission: 'manual',
    pricePerHour: '', pricePerDay: '', securityDeposit: '', city: '', pickupLocation: '',
  });
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => adminService.bikes.list().then((r) => setBikes(r.data));
  useEffect(() => { load(); cityService.list().then(setCities); }, []);
  useEffect(() => { if (form.city) locationService.list(form.city).then(setLocations); }, [form.city]);

  const updateField = (key: string) => (e: any) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photos) Array.from(photos).forEach((p) => fd.append('photos', p));
      await adminService.bikes.create(fd);
      toast.success('Bike added.');
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not add bike.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this bike?')) return;
    await adminService.bikes.remove(id);
    toast.success('Bike deleted.');
    load();
  };

  const setStatus = async (id: string, status: string) => {
    await adminService.bikes.setStatus(id, status);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bikes</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Add bike</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr><th className="p-4">Name</th><th className="p-4">City</th><th className="p-4">Price/day</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody>
            {bikes.map((b) => (
              <tr key={b._id} className="border-b border-gray-50">
                <td className="p-4 font-medium">{b.name}</td>
                <td className="p-4">{b.city?.name}</td>
                <td className="p-4">₹{b.pricePerDay}</td>
                <td className="p-4">
                  <select className="input !py-1 !text-xs" value={b.status} onChange={(e) => setStatus(b._id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-4"><button onClick={() => remove(b._id)}><Trash2 className="h-4 w-4 text-red-500" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="mb-4 font-bold">Add new bike</h3>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Name" value={form.name} onChange={updateField('name')} />
              <input className="input" placeholder="Brand" value={form.brand} onChange={updateField('brand')} />
              <input className="input" placeholder="Model" value={form.modelName} onChange={updateField('modelName')} />
              <input className="input" placeholder="Manufacturing year" value={form.manufacturingYear} onChange={updateField('manufacturingYear')} />
              <select className="input" value={form.category} onChange={updateField('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input" value={form.transmission} onChange={updateField('transmission')}>
                <option value="manual">Manual</option><option value="automatic">Automatic</option>
              </select>
              <input className="input" placeholder="Engine CC" value={form.engineCC} onChange={updateField('engineCC')} />
              <input className="input" placeholder="Mileage (km/l)" value={form.mileageKmpl} onChange={updateField('mileageKmpl')} />
              <input className="input" placeholder="Price per hour" value={form.pricePerHour} onChange={updateField('pricePerHour')} />
              <input className="input" placeholder="Price per day" value={form.pricePerDay} onChange={updateField('pricePerDay')} />
              <input className="input" placeholder="Security deposit" value={form.securityDeposit} onChange={updateField('securityDeposit')} />
              <select className="input" value={form.city} onChange={updateField('city')}>
                <option value="">Select city</option>
                {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <select className="input col-span-2" value={form.pickupLocation} onChange={updateField('pickupLocation')}>
                <option value="">Select pickup location</option>
                {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
              <input type="file" multiple accept="image/*" className="input col-span-2" onChange={(e) => setPhotos(e.target.files)} />
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary flex-1" disabled={submitting} onClick={submit}>{submitting ? 'Saving...' : 'Save bike'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
