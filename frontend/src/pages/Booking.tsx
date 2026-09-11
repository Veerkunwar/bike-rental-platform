import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bikeService, locationService } from '../services/bikeService';
import { bookingService, paymentService, couponService } from '../services/bookingService';
import { Bike, Location } from '../types';
import { MockRazorpayCheckout } from '../components/MockRazorpayCheckout';

export default function Booking() {
  const { bikeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [bike, setBike] = useState<Bike | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [pickupDate, setPickupDate] = useState(searchParams.get('pickupDate') || '');
  const [pickupTime, setPickupTime] = useState(searchParams.get('pickupTime') || '10:00');
  const [returnDate, setReturnDate] = useState(searchParams.get('returnDate') || '');
  const [returnTime, setReturnTime] = useState(searchParams.get('returnTime') || '18:00');
  const [wantsHelmet, setWantsHelmet] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const [submitting, setSubmitting] = useState(false);
  const [checkout, setCheckout] = useState<{ bookingId: string; orderId: string; amount: number } | null>(null);

  useEffect(() => {
    if (!bikeId) return;
    bikeService.getById(bikeId).then((b) => {
      setBike(b);
      setPickupLocationId(b.pickupLocation._id);
    });
  }, [bikeId]);

  useEffect(() => {
    if (bike) locationService.list(bike.city._id).then(setLocations);
  }, [bike]);

  const totalHours = (() => {
    if (!pickupDate || !returnDate) return 0;
    const p = new Date(`${pickupDate}T${pickupTime}`);
    const r = new Date(`${returnDate}T${returnTime}`);
    return Math.max(0, Math.ceil((r.getTime() - p.getTime()) / 36e5));
  })();

  const estimate = (() => {
    if (!bike || totalHours <= 0) return null;
    const days = Math.floor(totalHours / 24);
    const hrs = totalHours % 24;
    const rental = Math.round(Math.min(totalHours * bike.pricePerHour, days * bike.pricePerDay + hrs * bike.pricePerHour));
    const helmet = wantsHelmet && !bike.helmetIncluded ? 100 : 0;
    const discount = couponApplied
      ? Math.min(
          couponApplied.fixedDiscount || Math.round(((rental + helmet) * (couponApplied.discountPercentage || 0)) / 100),
          couponApplied.maxDiscount || Infinity,
        )
      : 0;
    const taxable = rental + helmet - discount;
    const taxes = Math.round(taxable * 0.18);
    const total = taxable + taxes + bike.securityDeposit;
    return { rental, helmet, discount, taxes, deposit: bike.securityDeposit, total };
  })();

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const coupon = await couponService.validate(couponCode, estimate?.rental);
      setCouponApplied(coupon);
      toast.success('Coupon applied!');
    } catch (err: any) {
      setCouponApplied(null);
      toast.error(err?.response?.data?.message || 'Invalid coupon.');
    }
  };

  const submitBooking = async () => {
    if (!bike || !pickupDate || !returnDate) { toast.error('Please select pickup and return date/time.'); return; }
    setSubmitting(true);
    try {
      const result = await bookingService.create({
        bikeId: bike._id,
        pickupLocationId,
        pickupDateTime: new Date(`${pickupDate}T${pickupTime}`).toISOString(),
        returnDateTime: new Date(`${returnDate}T${returnTime}`).toISOString(),
        wantsHelmet,
        couponCode: couponApplied ? couponCode : undefined,
        paymentMethod,
      });

      if (paymentMethod === 'online' && result.razorpayOrder) {
        setCheckout({
          bookingId: result.booking._id,
          orderId: result.razorpayOrder.id,
          amount: result.booking.priceBreakdown.totalPayable,
        });
      } else {
        toast.success('Booking confirmed! Pay at pickup.');
        navigate(`/my-bookings`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Booking failed. The bike may no longer be available for these dates.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string, signature: string) => {
    if (!checkout) return;
    try {
      await paymentService.verify({
        bookingId: checkout.bookingId,
        razorpayOrderId: checkout.orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      });
      toast.success('Payment successful! Booking confirmed.');
      navigate('/my-bookings');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Payment verification failed.');
    } finally {
      setCheckout(null);
    }
  };

  if (!bike) return <div className="p-10 text-center text-gray-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">Book {bike.name}</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="card space-y-4 p-6 lg:col-span-3">
          <div>
            <label className="label">Pickup location</label>
            <select className="input" value={pickupLocationId} onChange={(e) => setPickupLocationId(e.target.value)}>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Pickup date</label>
              <input type="date" className="input" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Pickup time</label>
              <input type="time" className="input" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Return date</label>
              <input type="date" className="input" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Return time</label>
              <input type="time" className="input" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
            </div>
          </div>

          {!bike.helmetIncluded && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={wantsHelmet} onChange={(e) => setWantsHelmet(e.target.checked)} />
              Add a helmet (+₹100)
            </label>
          )}

          <div>
            <label className="label">Coupon code</label>
            <div className="flex gap-2">
              <input className="input" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g. SAVE20" />
              <button className="btn-secondary" onClick={applyCoupon}>Apply</button>
            </div>
          </div>

          <div>
            <label className="label">Payment method</label>
            <div className="flex gap-3">
              <button className={`btn-secondary flex-1 ${paymentMethod === 'online' ? '!border-brand-600 !text-brand-700' : ''}`} onClick={() => setPaymentMethod('online')}>Pay Online</button>
              <button className={`btn-secondary flex-1 ${paymentMethod === 'cash' ? '!border-brand-600 !text-brand-700' : ''}`} onClick={() => setPaymentMethod('cash')}>Cash / Pay at Pickup</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card sticky top-20 p-6">
            <h2 className="mb-4 font-bold">Price summary</h2>
            {estimate ? (
              <div className="space-y-2 text-sm">
                <Row label="Rental amount" value={estimate.rental} />
                {estimate.helmet > 0 && <Row label="Helmet" value={estimate.helmet} />}
                {estimate.discount > 0 && <Row label="Discount" value={-estimate.discount} negative />}
                <Row label="Taxes (18%)" value={estimate.taxes} />
                <Row label="Security deposit" value={estimate.deposit} />
                <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 font-bold">
                  <span>Total payable</span><span>₹{estimate.total}</span>
                </div>
                <p className="text-xs text-gray-400">Final amount is calculated and verified on our server at checkout.</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select pickup and return date/time to see the price.</p>
            )}
            <button className="btn-primary mt-5 w-full" disabled={submitting || !estimate} onClick={submitBooking}>
              {submitting ? 'Processing...' : paymentMethod === 'online' ? 'Proceed to Payment' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>

      {checkout && (
        <MockRazorpayCheckout
          amount={checkout.amount}
          orderId={checkout.orderId}
          onSuccess={handlePaymentSuccess}
          onClose={() => setCheckout(null)}
        />
      )}
    </div>
  );
}

function Row({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={negative ? 'text-emerald-600' : ''}>{negative ? '-' : ''}₹{Math.abs(value)}</span>
    </div>
  );
}
