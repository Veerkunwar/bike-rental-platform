import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CalendarClock, Search } from 'lucide-react';
import { cityService, locationService, bikeService } from '../services/bikeService';
import { City, Location, Bike } from '../types';
import { BikeCard } from '../components/BikeCard';

export default function Home() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [featured, setFeatured] = useState<Bike[]>([]);

  const [cityId, setCityId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('18:00');

  useEffect(() => {
    cityService.list().then(setCities);
    bikeService.list({ sort: 'rating', limit: '8' }).then((r) => setFeatured(r.bikes));
  }, []);

  useEffect(() => {
    if (cityId) locationService.list(cityId).then(setLocations);
    else setLocations([]);
    setLocationId('');
  }, [cityId]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (cityId) params.set('city', cityId);
    if (pickupDate) params.set('pickupDate', pickupDate);
    if (pickupTime) params.set('pickupTime', pickupTime);
    if (returnDate) params.set('returnDate', returnDate);
    if (returnTime) params.set('returnTime', returnTime);
    if (locationId) params.set('location', locationId);
    navigate(`/bikes?${params.toString()}`);
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Rent a Bike. <span className="text-brand-200">Explore the City.</span>
          </h1>
          <p className="mt-4 max-w-xl text-brand-100">
            New in town? Find verified rental bikes near you in minutes — no local know-how required.
          </p>

          <div className="mt-10 rounded-2xl bg-white p-4 text-gray-900 shadow-xl sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="label flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> City</label>
                <select className="input" value={cityId} onChange={(e) => setCityId(e.target.value)}>
                  <option value="">Select city</option>
                  {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="label flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Pickup location</label>
                <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)} disabled={!cityId}>
                  <option value="">Any location</option>
                  {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>
              <div className="lg:col-span-1">
                <label className="label flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Pickup</label>
                <div className="flex flex-col gap-1.5 sm:flex-row">
                  <input type="date" className="input min-w-0" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                  <input type="time" className="input min-w-0" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                </div>
              </div>
              <div className="lg:col-span-1">
                <label className="label flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Return</label>
                <div className="flex flex-col gap-1.5 sm:flex-row">
                  <input type="date" className="input min-w-0" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                  <input type="time" className="input min-w-0" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
                </div>
              </div>
            </div>
            <button onClick={handleSearch} className="btn-primary mt-4 w-full sm:w-auto">
              <Search className="h-4 w-4" /> Search bikes
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-bold text-gray-900">Popular cities</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {cities.slice(0, 10).map((c) => (
            <button
              key={c._id}
              onClick={() => navigate(`/bikes?city=${c._id}`)}
              className="card flex flex-col items-center gap-1 p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <MapPin className="h-6 w-6 text-brand-600" />
              <span className="font-semibold text-gray-800">{c.name}</span>
              <span className="text-xs text-gray-500">{c.state}</span>
            </button>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Top rated bikes</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((b) => <BikeCard key={b._id} bike={b} />)}
          </div>
        </section>
      )}
    </div>
  );
}
