import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { cityService } from '../services/bikeService';
import { City } from '../types';

export default function Cities() {
  const [cities, setCities] = useState<City[]>([]);
  const navigate = useNavigate();
  useEffect(() => { cityService.list().then(setCities); }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">Cities we cover</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {cities.map((c) => (
          <button key={c._id} onClick={() => navigate(`/bikes?city=${c._id}`)} className="card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md">
            <MapPin className="mb-2 h-6 w-6 text-brand-600" />
            <p className="font-semibold">{c.name}</p>
            <p className="text-xs text-gray-500">{c.state}</p>
            {c.description && <p className="mt-2 text-xs text-gray-400 line-clamp-2">{c.description}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
