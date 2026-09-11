import { Link } from 'react-router-dom';
import { Star, MapPin, Fuel, Gauge } from 'lucide-react';
import { Bike } from '../types';

export function BikeCard({ bike }: { bike: Bike }) {
  return (
    <Link
      to={`/bikes/${bike._id}`}
      className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        <img
          src={bike.photos[0]}
          alt={bike.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold capitalize text-gray-700 shadow-sm">
          {bike.category}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{bike.name}</h3>
          <div className="flex shrink-0 items-center gap-1 text-sm text-amber-500">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {bike.averageRating || 'New'}
          </div>
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5" /> {bike.pickupLocation?.name}, {bike.city?.name}
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> {bike.transmission}</span>
          <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" /> {bike.fuelType}</span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900">₹{bike.pricePerDay}<span className="text-sm font-normal text-gray-500">/day</span></p>
            <p className="text-xs text-gray-500">₹{bike.pricePerHour}/hour</p>
          </div>
          <span className="btn-primary !px-3 !py-1.5 !text-xs">View details</span>
        </div>
      </div>
    </Link>
  );
}
