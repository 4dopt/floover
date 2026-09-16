import React, { useState } from 'react';
import { KeyRound, CheckCircle2, ShieldCheck, ExternalLink, Sparkles, HelpCircle } from 'lucide-react';
import { PricingPlanId } from '../types';
import { verifyAndActivateOrder, LEMON_SQUEEZY_CHECKOUT_URL, openLemonSqueezyCheckout } from '../utils/lemonSqueezy';
import { FloordoneLogo } from './FloordoneLogo';

interface ActivateAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (planId: PricingPlanId) => void;
}

export const ActivateAccessModal: React.FC<ActivateAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [orderInput, setOrderInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderInput.trim()) {
      setErrorMsg('Please enter your Lemon Squeezy Order # or License Key.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const result = await verifyAndActivateOrder(orderInput, emailInput);
      if (result.success) {
        setSuccessMsg(result.message);
        onSuccess(result.plan);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setErrorMsg(result.message || 'Verification failed. Please check your order number.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      id="modal-activate-access"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Activate Paid Access</h2>
              <p className="text-xs text-slate-500">
                Unlock Pro or Lifetime with your Lemon Squeezy purchase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-base font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-900">{successMsg}</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                All premium designer features, high-resolution PDF exports, and unlimited layouts are now active.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        {!successMsg && (
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Lemon Squeezy Order # or License Key <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Where do I find this?
                </button>
              </div>
              <input
                type="text"
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                placeholder="e.g. e505c90b-80d6-4140 or #123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>

            {showHelp && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 animate-in fade-in">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Look in your email receipt:
                </p>
                <p>
                  1. Check the email from <strong>Lemon Squeezy</strong> or <strong>Floordone</strong> sent immediately after purchase.
                </p>
                <p>
                  2. Your <strong>Order Number</strong> or <strong>License Key</strong> is displayed at the top of the receipt.
                </p>
                <p>
                  3. You can paste either the Order ID or your License Key here to unlock immediately.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Purchase Email (Optional)
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@restaurant.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                {errorMsg}
              </p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                {isVerifying ? (
                  <span>Verifying Order...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Activate Pro Access
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Footer info & Link to purchase */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>Haven't purchased a plan yet?</span>
          <a
            href={LEMON_SQUEEZY_CHECKOUT_URL}
            className="lemonsqueezy-button text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
            onClick={(e) => {
              e.preventDefault();
              openLemonSqueezyCheckout();
            }}
          >
            Buy Pricing plans <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
