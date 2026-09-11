import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookingService } from '../services/bookingService';
import { Booking } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

export default function BookingDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const showReview = params.get('review') === '1';

  useEffect(() => { if (id) bookingService.getById(id).then(setBooking); }, [id]);

  const submitReview = async () => {
    if (!booking) return;
    try {
      await api.post('/reviews', { bookingId: booking._id, rating, comment });
      toast.success('Thanks for your review!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not submit review.');
    }
  };

  if (!booking) return <div className="p-10 text-center text-gray-500">Loading...</div>;
  const p = booking.priceBreakdown;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{booking.bike?.name}</h1>
            <p className="text-xs text-gray-400">Booking ID: {booking.bookingId}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-400">Pickup</p><p>{new Date(booking.pickupDateTime).toLocaleString()}</p></div>
          <div><p className="text-gray-400">Return</p><p>{new Date(booking.returnDateTime).toLocaleString()}</p></div>
          <div><p className="text-gray-400">Location</p><p>{booking.pickupLocation?.name}</p></div>
          <div><p className="text-gray-400">Payment method</p><p className="capitalize">{booking.paymentMethod}</p></div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4 text-sm">
          <h2 className="mb-2 font-bold">Price breakdown</h2>
          <Row label="Rental amount" value={p.rentalAmount} />
          {p.helmetCharge > 0 && <Row label="Helmet" value={p.helmetCharge} />}
          {p.discount > 0 && <Row label="Discount" value={-p.discount} />}
          <Row label="Taxes" value={p.taxes} />
          <Row label="Security deposit" value={p.securityDeposit} />
          <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 font-bold">
            <span>Total</span><span>₹{p.totalPayable}</span>
          </div>
        </div>

        <button className="btn-secondary mt-6" onClick={() => toast('Invoice download requires the PDF service to be wired in — see /docs in README.')}>
          Download Invoice
        </button>
      </div>

      {showReview && booking.status === 'completed' && (
        <div className="card mt-6 p-6">
          <h2 className="mb-3 font-bold">Leave a review</h2>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className={`h-8 w-8 rounded-full text-sm font-bold ${n <= rating ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-400'}`}>{n}</button>
            ))}
          </div>
          <textarea className="input" rows={3} placeholder="How was your ride?" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn-primary mt-3" onClick={submitReview}>Submit Review</button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return <div className="flex justify-between py-0.5"><span className="text-gray-500">{label}</span><span>{value < 0 ? '-' : ''}₹{Math.abs(value)}</span></div>;
}
