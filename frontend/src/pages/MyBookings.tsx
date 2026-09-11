import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookingService } from '../services/bookingService';
import { Booking } from '../types';
import { StatusBadge } from '../components/StatusBadge';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Upcoming', value: 'confirmed' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    bookingService.myBookings(filter || undefined).then(setBookings).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const cancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await bookingService.cancel(id, 'Cancelled by user');
      toast.success('Booking cancelled.');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not cancel booking.');
    }
  };

  const CANCELLABLE = ['pending', 'confirmed', 'payment_pending', 'ready_for_pickup'];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-bold">My Bookings</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${filter === f.value ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : bookings.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">No bookings found for this filter.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900">{b.bike?.name}</p>
                  <p className="text-xs text-gray-400">Booking ID: {b.bookingId}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {new Date(b.pickupDateTime).toLocaleString()} → {new Date(b.returnDateTime).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Pickup: {b.pickupLocation?.name}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={b.status} />
                  <p className="mt-2 font-bold">₹{b.priceBreakdown.totalPayable}</p>
                  <p className="text-xs capitalize text-gray-400">{b.paymentMethod}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                <Link to={`/my-bookings/${b._id}`} className="btn-secondary !py-1.5 !text-xs">View Details</Link>
                {CANCELLABLE.includes(b.status) && (
                  <button className="btn-secondary !py-1.5 !text-xs !text-red-600" onClick={() => cancel(b._id)}>Cancel Booking</button>
                )}
                {b.status === 'completed' && (
                  <Link to={`/my-bookings/${b._id}?review=1`} className="btn-secondary !py-1.5 !text-xs">Leave a Review</Link>
                )}
                <Link to="/support" className="btn-secondary !py-1.5 !text-xs">Contact Support</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
