export default function AdminSettings() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="card p-6 text-sm text-gray-600">
        <p className="mb-2 font-semibold text-gray-800">Environment-driven settings</p>
        <p>Payment mode, storage driver, OTP mode, and map provider are all controlled via backend/.env — see the README for the full list of variables.</p>
      </div>
    </div>
  );
}
