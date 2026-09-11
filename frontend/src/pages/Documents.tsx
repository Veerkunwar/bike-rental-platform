import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { documentService } from '../services/documentService';

const DOC_TYPES: { key: 'governmentId' | 'drivingLicense' | 'selfie'; label: string; hint: string }[] = [
  { key: 'governmentId', label: 'Government ID', hint: 'Aadhaar, Passport, or Voter ID (JPG, PNG, or PDF)' },
  { key: 'drivingLicense', label: 'Driving License', hint: 'Valid two-wheeler driving license' },
  { key: 'selfie', label: 'Selfie / Profile Photo', hint: 'A clear photo of your face' },
];

export default function Documents() {
  const { user, refreshUser } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType);
    try {
      await documentService.upload(docType as any, file);
      toast.success('Document uploaded. Pending verification.');
      await refreshUser();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-4">
      {user && !user.documentsApproved && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You cannot book a bike until all three documents below are approved.
        </div>
      )}

      {DOC_TYPES.map(({ key, label, hint }) => {
        const doc = user?.documents?.[key];
        const status = doc?.status || 'not_uploaded';
        return (
          <div key={key} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{label}</h3>
                <StatusPill status={status} />
              </div>
              <p className="text-sm text-gray-500">{hint}</p>
              {status === 'rejected' && doc?.rejectionReason && (
                <p className="mt-1 text-sm text-red-600">Reason: {doc.rejectionReason}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {doc?.fileUrl && (
                <a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/api/documents/file/${user?.id}/${key}`} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:underline">
                  View
                </a>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                className="hidden"
                ref={(el) => (fileRefs.current[key] = el)}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(key, f); }}
              />
              <button
                className="btn-secondary"
                disabled={uploading === key}
                onClick={() => fileRefs.current[key]?.click()}
              >
                <UploadCloud className="h-4 w-4" />
                {uploading === key ? 'Uploading...' : status === 'not_uploaded' ? 'Upload' : 'Re-upload'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === 'approved') return <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Approved</span>;
  if (status === 'rejected') return <span className="flex items-center gap-1 text-xs font-medium text-red-600"><XCircle className="h-3.5 w-3.5" /> Rejected</span>;
  if (status === 'pending') return <span className="flex items-center gap-1 text-xs font-medium text-amber-600"><Clock className="h-3.5 w-3.5" /> Pending Verification</span>;
  return <span className="text-xs font-medium text-gray-400">Not Uploaded</span>;
}
