import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, MapPin, Fuel, Gauge, ShieldCheck, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { bikeService } from '../services/bikeService';
import { Bike } from '../types';
import { useAuth } from '../context/AuthContext';

export default function BikeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bike, setBike] = useState<Bike | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    bikeService.getById(id).then(setBike);
    bikeService.reviews(id).then(setReviews);
  }, [id]);

  if (!bike) return <div className="p-10 text-center text-gray-500">Loading bike details...</div>;

  const handleBookNow = () => {
    if (!user) { navigate('/login', { state: { from: { pathname: `/booking/${bike._id}` } } }); return; }
    if (!user.documentsApproved) {
      toast.error('Please upload and verify your required documents before booking a bike.');
      navigate('/profile/documents');
      return;
    }
    navigate(`/booking/${bike._id}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="h-80 w-full overflow-hidden rounded-2xl bg-gray-100">
            <img src={bike.photos[activePhoto]} alt={bike.name} className="h-full w-full object-cover" />
          </div>
          {bike.photos.length > 1 && (
            <div className="mt-3 flex gap-2">
              {bike.photos.map((p, i) => (
                <button key={i} onClick={() => setActivePhoto(i)} className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === activePhoto ? 'border-brand-600' : 'border-transparent'}`}>
                  <img src={p} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Specifications</h2>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Spec label="Brand" value={bike.brand} />
              <Spec label="Model" value={bike.modelName} />
              <Spec label="Year" value={String(bike.manufacturingYear)} />
              {bike.engineCC && <Spec label="Engine" value={`${bike.engineCC}cc`} />}
              {bike.mileageKmpl && <Spec label="Mileage" value={`${bike.mileageKmpl} km/l`} />}
              <Spec label="Fuel type" value={bike.fuelType} />
              <Spec label="Transmission" value={bike.transmission} />
              <Spec label="Helmet" value={bike.helmetIncluded ? 'Included' : 'Not included'} />
              <Spec label="Security deposit" value={`₹${bike.securityDeposit}`} />
            </div>
          </div>

          {bike.rentalTerms && (
            <div className="mt-8">
              <h2 className="mb-2 text-lg font-bold">Rental terms</h2>
              <p className="text-sm text-gray-600">{bike.rentalTerms}</p>
            </div>
          )}
          {bike.cancellationPolicy && (
            <div className="mt-4">
              <h2 className="mb-2 text-lg font-bold">Cancellation policy</h2>
              <p className="text-sm text-gray-600">{bike.cancellationPolicy}</p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r._id} className="card p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="font-medium">{r.user?.fullName}</p>
                      <span className="flex items-center gap-1 text-sm text-amber-500">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {r.rating}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card sticky top-20 p-6">
            <h1 className="text-xl font-bold">{bike.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-4 w-4" /> {bike.pickupLocation?.name}, {bike.city?.name}
            </p>
            <div className="mt-2 flex items-center gap-1 text-sm text-amber-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {bike.averageRating || 'New'} ({bike.reviewCount} reviews)
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Gauge className="h-4 w-4" /> {bike.transmission}</span>
              <span className="flex items-center gap-1"><Fuel className="h-4 w-4" /> {bike.fuelType}</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Deposit ₹{bike.securityDeposit}</span>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-5">
              <p className="text-2xl font-extrabold text-gray-900">₹{bike.pricePerDay}<span className="text-sm font-normal text-gray-500">/day</span></p>
              <p className="text-sm text-gray-500">or ₹{bike.pricePerHour}/hour</p>
            </div>

            <div className="mt-5 flex gap-3">
              <button className="btn-primary flex-1" onClick={handleBookNow}>Book Now</button>
              <button className="btn-secondary" title="Add to wishlist"><Heart className="h-4 w-4" /></button>
            </div>
            <a href={`mailto:support@rideit.example?subject=Question about ${bike.name}`} className="mt-3 block text-center text-sm text-brand-600 hover:underline">
              Contact rental provider
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-400">{label}</p>
      <p className="font-medium capitalize text-gray-800">{value}</p>
    </div>
  );
}
