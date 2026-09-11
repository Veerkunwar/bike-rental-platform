import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../../components/StatusBadge';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export default function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const load = () => adminService.support.list().then(setTickets);
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminService.support.updateStatus(id, status);
      toast.success('Ticket updated.');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed.');
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Support Tickets</h1>
      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t._id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{t.subject}</p>
                <p className="text-xs text-gray-500">{t.user?.fullName} · {t.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
                <select className="input !py-1 !text-xs" value={t.status} onChange={(e) => updateStatus(t._id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        {tickets.length === 0 && <div className="card p-8 text-center text-gray-500">No tickets.</div>}
      </div>
    </div>
  );
}
