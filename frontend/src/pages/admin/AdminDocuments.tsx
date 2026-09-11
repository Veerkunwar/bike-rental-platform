import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

const DOC_TYPES = ['governmentId', 'drivingLicense', 'selfie'] as const;

export default function AdminDocuments() {
  const [users, setUsers] = useState<any[]>([]);
  const [rejectingFor, setRejectingFor] = useState<{ userId: string; docType: string } | null>(null);
  const [reason, setReason] = useState('');

  const load = () => adminService.documents.pending().then(setUsers);
  useEffect(() => { load(); }, []);

  const approve = async (userId: string, docType: string) => {
    try {
      await adminService.documents.approve(userId, docType);
      toast.success('Document approved.');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not approve.');
    }
  };

  const submitReject = async () => {
    if (!rejectingFor || !reason) return;
    try {
      await adminService.documents.reject(rejectingFor.userId, rejectingFor.docType, reason);
      toast.success('Document rejected.');
      setRejectingFor(null);
      setReason('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not reject.');
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pending Document Verification</h1>
      {users.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">No documents pending review.</div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u._id} className="card p-5">
              <p className="mb-3 font-semibold">{u.fullName} <span className="text-xs text-gray-400">({u.email})</span></p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {DOC_TYPES.map((docType) => {
                  const doc = u.documents?.[docType];
                  if (!doc || doc.status !== 'pending') return null;
                  return (
                    <div key={docType} className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-1 text-sm font-medium capitalize">{docType.replace(/([A-Z])/g, ' $1')}</p>
                      <a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/api/documents/file/${u._id}/${docType}`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">View file</a>
                      <div className="mt-2 flex gap-2">
                        <button className="btn-secondary !py-1 !text-xs !text-emerald-700" onClick={() => approve(u._id, docType)}>Approve</button>
                        <button className="btn-secondary !py-1 !text-xs !text-red-600" onClick={() => setRejectingFor({ userId: u._id, docType })}>Reject</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-3 font-bold">Reject document</h3>
            <textarea className="input" rows={3} placeholder="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="mt-3 flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setRejectingFor(null)}>Cancel</button>
              <button className="btn-danger flex-1" onClick={submitReject}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
