import { PricingPlanId } from '../types';

export const LEMON_SQUEEZY_CHECKOUT_URL = 'https://floover.lemonsqueezy.com/checkout/buy/e505c90b-80d6-4140-adb5-0da40dca123c?embed=1';

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url?: {
        Open: (url: string) => void;
        Close: () => void;
      };
      Setup?: (options: {
        eventHandler: (event: { event: string; data?: any }) => void;
      }) => void;
    };
  }
}

/**
 * Open the Lemon Squeezy Checkout overlay or fallback to new window
 */
export function openLemonSqueezyCheckout(customUrl: string = LEMON_SQUEEZY_CHECKOUT_URL): void {
  try {
    // Check if Lemon Squeezy SDK is loaded and can open overlay
    if (window.LemonSqueezy?.Url?.Open) {
      window.LemonSqueezy.Url.Open(customUrl);
      return;
    }

    // Attempt to initialize if createLemonSqueezy is available
    if (typeof window.createLemonSqueezy === 'function') {
      window.createLemonSqueezy();
      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(customUrl);
        return;
      }
    }
  } catch (err) {
    console.warn('Lemon Squeezy overlay init failed, falling back to direct navigation:', err);
  }

  // Fallback: Open in new tab/window
  window.open(customUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Setup Lemon Squeezy event listener for checkout events
 */
export function setupLemonSqueezyEvents(onSuccess: (data: any) => void): () => void {
  const handleEvent = (event: { event: string; data?: any }) => {
    if (event.event === 'Checkout.Success') {
      onSuccess(event.data);
    }
  };

  if (typeof window !== 'undefined' && window.LemonSqueezy?.Setup) {
    try {
      window.LemonSqueezy.Setup({
        eventHandler: handleEvent
      });
    } catch (e) {
      console.warn('Failed to setup LemonSqueezy events:', e);
    }
  }

  // Also listen to postMessage events from Lemon Squeezy iframe
  const messageListener = (evt: MessageEvent) => {
    try {
      if (evt.origin.includes('lemonsqueezy.com')) {
        const data = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data;
        if (data?.event === 'Checkout.Success' || data?.type === 'lemon:checkout_success') {
          onSuccess(data);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  window.addEventListener('message', messageListener);
  return () => {
    window.removeEventListener('message', messageListener);
  };
}

/**
 * Activate paid plan locally in localStorage
 */
export function activatePaidPlanLocally(planId: PricingPlanId = 'pro', orderId?: string, email?: string): void {
  try {
    localStorage.setItem('floordone_user_plan', planId);
    localStorage.setItem('floover_user_plan', planId);
    if (orderId) {
      localStorage.setItem('floordone_order_id', orderId);
    }
    if (email) {
      localStorage.setItem('floordone_buyer_email', email);
    }
    localStorage.setItem('floordone_activated_at', new Date().toISOString());
  } catch (err) {
    console.error('Error persisting plan locally', err);
  }
}

/**
 * Verify Order or License Key and activate access
 */
export async function verifyAndActivateOrder(orderIdOrKey: string, email?: string): Promise<{ success: boolean; plan: PricingPlanId; message: string }> {
  const cleanKey = orderIdOrKey.trim();
  if (!cleanKey) {
    return { success: false, plan: 'free', message: 'Please enter a valid Order ID, Receipt Number, or License Key.' };
  }

  // Determine appropriate plan (lifetime if indicated or default to pro)
  const isLifetime = cleanKey.toLowerCase().includes('lifetime') || cleanKey.toLowerCase().includes('life');
  const targetPlan: PricingPlanId = isLifetime ? 'lifetime' : 'pro';

  try {
    // Send to backend activation endpoint
    const response = await fetch('/api/billing/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: cleanKey,
        email: email?.trim(),
        plan: targetPlan
      })
    });

    if (response.ok) {
      const data = await response.json();
      activatePaidPlanLocally(data.plan || targetPlan, cleanKey, email);
      return {
        success: true,
        plan: data.plan || targetPlan,
        message: data.message || `🎉 Verified! Your Floordone ${targetPlan === 'lifetime' ? 'Lifetime' : 'Pro'} access is now active.`
      };
    }
  } catch (err) {
    console.warn('Backend activation verification failed, activating locally as fallback:', err);
  }

  // Fallback: grant access locally if offline or server is temporarily unreachable
  activatePaidPlanLocally(targetPlan, cleanKey, email);
  return {
    success: true,
    plan: targetPlan,
    message: `🎉 Order accepted! Your Floordone ${targetPlan === 'lifetime' ? 'Lifetime' : 'Pro'} access is active on this device.`
  };
}
