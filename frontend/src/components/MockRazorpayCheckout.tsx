import { useState } from 'react';
import { CreditCard, X } from 'lucide-react';

interface Props {
  amount: number;
  orderId: string;
  onSuccess: (paymentId: string, signature: string) => void;
  onClose: () => void;
}

/**
 * Stand-in for the real Razorpay Checkout.js modal, used automatically while
 * PAYMENTS_MOCK_MODE=true on the backend (no real Razorpay keys configured
 * yet). It mimics the real modal's shape (amount, "Pay Now" button) and
 * produces a mock payment id + signature the backend mock-mode verifier
 * accepts, so the entire booking -> pay -> confirm flow can be tested.
 *
 * Once real RAZORPAY_KEY_ID/SECRET are set and PAYMENTS_MOCK_MODE=false,
 * swap this component for the actual Razorpay Checkout.js script:
 *   const options = { key: import.meta.env.VITE_RAZORPAY_KEY_ID, amount, order_id: orderId,
 *     handler: (resp) => onSuccess(resp.razorpay_payment_id, resp.razorpay_signature) };
 *   new (window as any).Razorpay(options).open();
 */
export function MockRazorpayCheckout({ amount, orderId, onSuccess, onClose }: Props) {
  const [processing, setProcessing] = useState(false);

  const pay = async () => {
    setProcessing(true);
    // Generate a mock payment id + a SHA-256(`${orderId}|${paymentId}|mock`) signature,
    // matching exactly what razorpayService.verifyPaymentSignature expects in mock mode.
    const paymentId = `pay_mock_${Math.random().toString(16).slice(2, 12)}`;
    const enc = new TextEncoder().encode(`${orderId}|${paymentId}|mock`);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    const signature = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');

    setTimeout(() => {
      setProcessing(false);
      onSuccess(paymentId, signature);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-2 font-bold text-gray-800"><CreditCard className="h-5 w-5" /> Razorpay (Test)</p>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-500">Order ID: {orderId}</p>
        <p className="mt-1 text-3xl font-extrabold text-gray-900">₹{amount}</p>
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
          Test mode: no real charge is made. Click "Pay Now" to simulate a successful payment.
        </p>
        <button className="btn-primary mt-5 w-full" disabled={processing} onClick={pay}>
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  );
}
