import { Routes, Route } from 'react-router-dom';
import { UserLayout } from './layouts/UserLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Bikes from './pages/Bikes';
import BikeDetails from './pages/BikeDetails';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import Profile from './pages/Profile';
import ProfileInfo from './pages/ProfileInfo';
import Documents from './pages/Documents';
import Wishlist from './pages/Wishlist';
import Notifications from './pages/Notifications';
import Cities from './pages/Cities';
import Support from './pages/Support';
import NotFound from './pages/NotFound';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminBikes from './pages/admin/AdminBikes';
import AdminCities from './pages/admin/AdminCities';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPayments from './pages/admin/AdminPayments';
import AdminRefunds from './pages/admin/AdminRefunds';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminReviews from './pages/admin/AdminReviews';
import AdminSupport from './pages/admin/AdminSupport';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  return (
    <Routes>
      {/* ---------- Public + user-panel routes ---------- */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/bikes" element={<Bikes />} />
        <Route path="/bikes/:id" element={<BikeDetails />} />
        <Route path="/cities" element={<Cities />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/booking/:bikeId" element={<Booking />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/my-bookings/:id" element={<BookingDetails />} />
          <Route path="/profile" element={<Profile />}>
            <Route index element={<ProfileInfo />} />
            <Route path="documents" element={<Documents />} />
          </Route>
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/support" element={<Support />} />
        </Route>
      </Route>

      {/* ---------- Admin panel (completely separate layout/auth) ---------- */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="bikes" element={<AdminBikes />} />
          <Route path="cities" element={<AdminCities />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
