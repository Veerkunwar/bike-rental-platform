import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
          {user?.fullName?.[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user?.fullName}</h1>
          <p className="text-sm text-gray-500">{user?.email} · {user?.phone}</p>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <NavLink to="" end className={({ isActive }) => `border-b-2 px-4 py-2 text-sm font-medium ${isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500'}`}>
          Profile Info
        </NavLink>
        <NavLink to="documents" className={({ isActive }) => `border-b-2 px-4 py-2 text-sm font-medium ${isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500'}`}>
          Documents
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
}
