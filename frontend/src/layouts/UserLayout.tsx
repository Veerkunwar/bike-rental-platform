import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bike as BikeIcon, Menu, X, Bell, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/bikes', label: 'Explore Bikes' },
  { to: '/cities', label: 'Cities' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/wishlist', label: 'Wishlist' },
];

export function UserLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
            <BikeIcon className="h-6 w-6" /> RideIt
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition hover:text-brand-700 ${isActive ? 'text-brand-700' : 'text-gray-600'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link to="/notifications" className="rounded-full p-2 text-gray-600 hover:bg-gray-100">
                  <Bell className="h-5 w-5" />
                </Link>
                <Link to="/profile" className="rounded-full p-2 text-gray-600 hover:bg-gray-100">
                  <UserIcon className="h-5 w-5" />
                </Link>
                <Link to="/dashboard" className="btn-secondary !py-2">Dashboard</Link>
                <button
                  className="text-sm font-medium text-gray-500 hover:text-gray-800"
                  onClick={async () => { await logout(); navigate('/'); }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-brand-700">Login</Link>
                <Link to="/register" className="btn-primary !py-2">Sign up</Link>
              </>
            )}
          </div>

          <button className="p-2 md:hidden" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-gray-100 px-4 pb-4 md:hidden">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="block py-2 text-sm text-gray-700" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-gray-100 pt-3">
              {user ? (
                <>
                  <Link to="/dashboard" className="btn-secondary flex-1" onClick={() => setOpen(false)}>Dashboard</Link>
                  <button className="btn-secondary flex-1" onClick={async () => { await logout(); setOpen(false); navigate('/'); }}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary flex-1" onClick={() => setOpen(false)}>Login</Link>
                  <Link to="/register" className="btn-primary flex-1" onClick={() => setOpen(false)}>Sign up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-gray-500 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="flex items-center gap-2 font-semibold text-gray-700"><BikeIcon className="h-5 w-5" /> RideIt</p>
            <p>© {new Date().getFullYear()} RideIt. Rent a bike, explore any city.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
