const STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  payment_pending: 'bg-orange-100 text-orange-800',
  ready_for_pickup: 'bg-blue-100 text-blue-800',
  active: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  approved: 'bg-emerald-100 text-emerald-800',
  not_uploaded: 'bg-gray-100 text-gray-500',
  available: 'bg-emerald-100 text-emerald-800',
  booked: 'bg-amber-100 text-amber-800',
  rented: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-orange-100 text-orange-800',
  disabled: 'bg-gray-200 text-gray-500',
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-200 text-gray-600',
  successful: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-800',
  cash_pending: 'bg-amber-100 text-amber-800',
  cash_received: 'bg-emerald-100 text-emerald-800',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] || 'bg-gray-100 text-gray-700';
  return <span className={`badge ${style}`}>{status.replace(/_/g, ' ')}</span>;
}
