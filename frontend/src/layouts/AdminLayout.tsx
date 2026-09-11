import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileCheck2, Bike as BikeIcon, MapPin, CalendarCheck2,
  CreditCard, RotateCcw, Tag, Star, LifeBuoy, Bell, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/documents', label: 'Documents', icon: FileCheck2 },
  { to: '/admin/bikes', label: 'Bikes', icon: BikeIcon },
  { to: '/admin/cities', label: 'Cities & Locations', icon: MapPin },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck2 },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/refunds', label: 'Refunds', icon: RotateCcw },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/support', label: 'Support', icon: LifeBuoy },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 font-bold text-brand-700">
          <BikeIcon className="h-6 w-6" /> RideIt Admin
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            onClick={async () => { await logout(); navigate('/admin/login'); }}
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-8">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="text-sm font-semibold text-gray-800">{user?.fullName} ({user?.email})</p>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
