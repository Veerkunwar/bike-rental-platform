import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminService.users.list({ search }).then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const toggleSuspend = async (u: any) => {
    try {
      if (u.isSuspended) { await adminService.users.activate(u._id); toast.success('User activated.'); }
      else { await adminService.users.suspend(u._id); toast.success('User suspended.'); }
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search name, email, phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Phone</th><th className="p-4">Status</th><th className="p-4">Documents</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={6}>Loading...</td></tr>
            ) : users.map((u) => (
              <tr key={u._id} className="border-b border-gray-50">
                <td className="p-4 font-medium">{u.fullName}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">{u.phone}</td>
                <td className="p-4">
                  <span className={`badge ${u.isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                    {u.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td className="p-4 text-xs">
                  {['governmentId', 'drivingLicense', 'selfie'].map((k) => (
                    <span key={k} className="mr-1 capitalize">{u.documents?.[k]?.status?.slice(0, 1)}</span>
                  ))}
                </td>
                <td className="p-4">
                  <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => toggleSuspend(u)}>
                    {u.isSuspended ? 'Activate' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
