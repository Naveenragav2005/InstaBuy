/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_SERVICE_URL?: string;
  readonly VITE_INVENTORY_SERVICE_URL?: string;
  readonly VITE_ORDER_SERVICE_URL?: string;
  readonly VITE_PAYMENT_SERVICE_URL?: string;
  readonly VITE_RAZORPAY_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
