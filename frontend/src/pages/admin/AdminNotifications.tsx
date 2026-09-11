export default function AdminNotifications() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Notifications</h1>
      <div className="card p-8 text-center text-gray-500">
        Notifications are currently per-user (see Notification model) and triggered automatically by booking,
        payment, and document events. A broadcast/announcement tool can be added here by looping adminService
        calls over User ids.
      </div>
    </div>
  );
}
