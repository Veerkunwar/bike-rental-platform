import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { StatusBadge } from '../../components/StatusBadge';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  useEffect(() => { adminService.payments.list().then((r) => setPayments(r.data)); }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Payments</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr>
              <th className="p-4">Transaction ID</th><th className="p-4">Booking</th><th className="p-4">User</th>
              <th className="p-4">Amount</th><th className="p-4">Method</th><th className="p-4">Status</th><th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id} className="border-b border-gray-50">
                <td className="p-4 text-xs">{p.razorpayPaymentId || p._id}</td>
                <td className="p-4">{p.booking?.bookingId}</td>
                <td className="p-4">{p.user?.fullName}</td>
                <td className="p-4">₹{p.amount}</td>
                <td className="p-4 capitalize">{p.method}</td>
                <td className="p-4"><StatusBadge status={p.status} /></td>
                <td className="p-4 text-xs">{new Date(p.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
