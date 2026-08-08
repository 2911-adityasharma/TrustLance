import React from 'react';
import ReactDOM from 'react-dom/client';
import PaymentCheckout from '../components/PaymentCheckout';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <PaymentCheckout />
    </div>
  </React.StrictMode>
);
