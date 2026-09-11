import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../../components/StatusBadge';

const STATUSES = ['pending', 'confirmed', 'payment_pending', 'ready_for_pickup', 'active', 'completed', 'cancelled', 'rejected'];

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingIdFilter, setBookingIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => adminService.bookings.list({ bookingId: bookingIdFilter, status: statusFilter }).then((r) => setBookings(r.data));
  useEffect(() => { load(); }, [bookingIdFilter, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminService.bookings.updateStatus(id, status);
      toast.success('Booking status updated.');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed.');
    }
  };

  const confirmCash = async (id: string, received: boolean) => {
    await adminService.bookings.confirmCash(id, received);
    toast.success(`Cash marked as ${received ? 'received' : 'not received'}.`);
    load();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Bookings</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search booking ID" value={bookingIdFilter} onChange={(e) => setBookingIdFilter(e.target.value)} />
        <select className="input max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr><th className="p-4">Booking ID</th><th className="p-4">User</th><th className="p-4">Bike</th><th className="p-4">Status</th><th className="p-4">Payment</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id} className="border-b border-gray-50">
                <td className="p-4 font-medium">{b.bookingId}</td>
                <td className="p-4">{b.user?.fullName}</td>
                <td className="p-4">{b.bike?.name}</td>
                <td className="p-4"><StatusBadge status={b.status} /></td>
                <td className="p-4 capitalize">{b.paymentMethod}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    <select className="input !py-1 !text-xs" value={b.status} onChange={(e) => updateStatus(b._id, e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {b.paymentMethod === 'cash' && (
                      <>
                        <button className="btn-secondary !py-1 !text-xs" onClick={() => confirmCash(b._id, true)}>Cash Received</button>
                        <button className="btn-secondary !py-1 !text-xs" onClick={() => confirmCash(b._id, false)}>Not Received</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
