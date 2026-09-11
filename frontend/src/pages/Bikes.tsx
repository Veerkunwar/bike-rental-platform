import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { bikeService, cityService } from '../services/bikeService';
import { Bike, City } from '../types';
import { BikeCard } from '../components/BikeCard';

const CATEGORIES = ['scooty', 'scooter', 'commuter', 'sports', 'cruiser', 'adventure', 'electric'];

export default function Bikes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const city = searchParams.get('city') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  useEffect(() => { cityService.list().then(setCities); }, []);

  useEffect(() => {
    setLoading(true);
    bikeService
      .list({ city, category, sort, minPrice, maxPrice, limit: '24' })
      .then((r) => setBikes(r.bikes))
      .finally(() => setLoading(false));
  }, [city, category, sort, minPrice, maxPrice]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Explore bikes</h1>
        <button className="btn-secondary lg:hidden" onClick={() => setShowFilters((s) => !s)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className={`card h-fit space-y-5 p-5 lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div>
            <label className="label">City</label>
            <select className="input" value={city} onChange={(e) => setParam('city', e.target.value)}>
              <option value="">All cities</option>
              {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Bike type</label>
            <select className="input" value={category} onChange={(e) => setParam('category', e.target.value)}>
              <option value="">All types</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Price range (per day)</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" className="input" value={minPrice} onChange={(e) => setParam('minPrice', e.target.value)} />
              <input type="number" placeholder="Max" className="input" value={maxPrice} onChange={(e) => setParam('maxPrice', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Sort by</label>
            <select className="input" value={sort} onChange={(e) => setParam('sort', e.target.value)}>
              <option value="">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </aside>

        <div className="lg:col-span-3">
          {loading ? (
            <p className="text-gray-500">Loading bikes...</p>
          ) : bikes.length === 0 ? (
            <div className="card p-10 text-center text-gray-500">
              No bikes match your filters. Try widening your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {bikes.map((b) => <BikeCard key={b._id} bike={b} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
