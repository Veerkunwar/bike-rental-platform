import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-extrabold text-brand-600">404</h1>
      <p className="mt-2 text-gray-500">Page not found.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
