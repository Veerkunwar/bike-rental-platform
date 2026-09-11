import { useEffect, useState } from 'react';
import { Bell, BellDot } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);

  const load = () => notificationService.list().then(setItems);
  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await notificationService.markRead(id);
    load();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">Notifications</h1>
      {items.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">You're all caught up.</div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`card flex w-full items-start gap-3 p-4 text-left transition ${n.isRead ? 'opacity-70' : 'border-brand-200 bg-brand-50/40'}`}
            >
              {n.isRead ? <Bell className="mt-0.5 h-5 w-5 text-gray-400" /> : <BellDot className="mt-0.5 h-5 w-5 text-brand-600" />}
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-gray-500">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
