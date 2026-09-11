import { useEffect, useState } from 'react';
import { Users, Bike as BikeIcon, CalendarCheck2, IndianRupee, FileWarning, CreditCard } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);

  useEffect(() => {
    adminService.dashboard.stats().then(setStats);
    adminService.dashboard.charts().then(setCharts);
  }, []);

  if (!stats) return <p className="text-gray-500">Loading dashboard...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={Users} label="Total Users" value={stats.totalUsers} />
        <Stat icon={BikeIcon} label="Total Bikes" value={stats.totalBikes} />
        <Stat icon={BikeIcon} label="Available Bikes" value={stats.availableBikes} />
        <Stat icon={CalendarCheck2} label="Active Rentals" value={stats.activeRentals} />
        <Stat icon={CalendarCheck2} label="Total Bookings" value={stats.totalBookings} />
        <Stat icon={CalendarCheck2} label="Pending Bookings" value={stats.pendingBookings} />
        <Stat icon={CalendarCheck2} label="Cancelled Bookings" value={stats.cancelledBookings} />
        <Stat icon={IndianRupee} label="Revenue" value={`₹${stats.revenue}`} />
        <Stat icon={CreditCard} label="Pending Payments" value={stats.pendingPayments} />
        <Stat icon={CreditCard} label="Cash Payments" value={stats.cashPayments} />
        <Stat icon={CreditCard} label="Online Payments" value={stats.onlinePayments} />
        <Stat icon={FileWarning} label="Pending Documents" value={stats.pendingDocuments} />
      </div>

      {charts && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Popular cities">
            {charts.popularCities.map((c: any) => (
              <BarRow key={c._id} label={c._id} value={c.count} max={charts.popularCities[0]?.count || 1} />
            ))}
          </ChartCard>
          <ChartCard title="Popular bikes">
            {charts.popularBikes.map((b: any) => (
              <BarRow key={b._id} label={b.name} value={b.count} max={charts.popularBikes[0]?.count || 1} />
            ))}
          </ChartCard>
          <ChartCard title="Payment methods">
            {charts.paymentMethods.map((p: any) => (
              <BarRow key={p._id} label={p._id} value={p.count} max={Math.max(...charts.paymentMethods.map((x: any) => x.count), 1)} />
            ))}
          </ChartCard>
          <ChartCard title="Daily bookings (last 30 days)">
            <p className="text-xs text-gray-400">{charts.dailyBookings.length} data points — plug into a charting lib (recharts) for a visual trend line.</p>
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <Icon className="h-5 w-5 text-brand-600" />
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-500"><span className="capitalize">{label}</span><span>{value}</span></div>
      <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${(value / max) * 100}%` }} /></div>
    </div>
  );
}
