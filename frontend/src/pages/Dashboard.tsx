import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Bike as BikeIcon, Receipt, Wallet } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => { bookingService.myBookings().then(setBookings); }, []);

  const upcoming = bookings.filter((b) => ['confirmed', 'payment_pending', 'ready_for_pickup'].includes(b.status));
  const active = bookings.filter((b) => b.status === 'active');
  const completed = bookings.filter((b) => b.status === 'completed');
  const totalSpent = completed.reduce((sum, b) => sum + b.priceBreakdown.totalPayable, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-bold">Welcome, {user?.fullName?.split(' ')[0]}</h1>
      <p className="mb-6 text-sm text-gray-500">Here's what's happening with your rentals.</p>

      {user && !user.documentsApproved && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your documents are not fully approved yet. <Link to="/profile/documents" className="font-semibold underline">Upload / check status</Link> before booking a bike.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Upcoming Booking" value={upcoming.length} />
        <StatCard icon={BikeIcon} label="Active Rental" value={active.length} />
        <StatCard icon={Receipt} label="Total Trips" value={completed.length} />
        <StatCard icon={Wallet} label="Total Spent" value={`₹${totalSpent}`} />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent bookings</h2>
          <Link to="/my-bookings" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>
        {bookings.length === 0 ? (
          <div className="card p-8 text-center text-sm text-gray-500">
            No bookings yet. <Link to="/bikes" className="text-brand-600 hover:underline">Explore bikes</Link> to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => (
              <div key={b._id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{b.bike?.name} <span className="text-xs text-gray-400">({b.bookingId})</span></p>
                  <p className="text-xs text-gray-500">{new Date(b.pickupDateTime).toLocaleString()} → {new Date(b.returnDateTime).toLocaleString()}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <Icon className="h-5 w-5 text-brand-600" />
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
