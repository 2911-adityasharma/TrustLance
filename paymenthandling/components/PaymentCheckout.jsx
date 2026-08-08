import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, Smartphone, AlertCircle, CheckCircle2, Loader2, ArrowRight, Sparkles } from 'lucide-react';

const API_BASE = 'http://localhost:5000';
const CONVERSION_RATE = 83.33; // 1 USDC ≈ ₹83.33
const DEMO_FREELANCER = '0x3C44Cddb6a900fa2b585dd299e03d12FA4293BCF'; // Hardhat Account #2

export default function PaymentCheckout() {
  // Form States
  const [freelancerAddress, setFreelancerAddress] = useState('');
  const [amountInINR, setAmountInINR] = useState('');
  const [usdcAmount, setUsdcAmount] = useState(0);

  // Workflow State: 1 = Form & Scan UPI, 3 = Escrow Locked Success
  const [currentStep, setCurrentStep] = useState(1);
  const [demoMode, setDemoMode] = useState(false);

  // Transaction States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // INR → USDC conversion
  useEffect(() => {
    if (amountInINR && !isNaN(Number(amountInINR))) {
      setUsdcAmount(Math.round((Number(amountInINR) / CONVERSION_RATE) * 100) / 100);
    } else {
      setUsdcAmount(0);
    }
  }, [amountInINR]);

  // Demo Mode Toggle
  const handleDemoToggle = () => {
    const nextDemo = !demoMode;
    setDemoMode(nextDemo);
    setErrorMsg('');
    setSuccessData(null);

    if (nextDemo) {
      setFreelancerAddress(DEMO_FREELANCER);
      setAmountInINR('5000');
      setCurrentStep(1);
    } else {
      setFreelancerAddress('');
      setAmountInINR('');
    }
  };

  // Address validation
  const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);
  const isFormValid = () => isValidAddress(freelancerAddress) && Number(amountInINR) > 0;

  // Dynamic UPI URI format: upi://pay?pa=yourvpa@upi&pn=EscrowPlatform&am={amountInINR}&cu=INR
  const upiUri = `upi://pay?pa=yourvpa@upi&pn=EscrowPlatform&am=${amountInINR || 0}&cu=INR`;

  const handleUpiAppRedirect = () => {
    if (!amountInINR) return;
    window.location.href = upiUri;
  };

  // Unified UPI Payment Handler
  const handlePayUpi = async (overrideData = null) => {
    const targetFreelancer = overrideData?.freelancerAddress || freelancerAddress;
    const targetInr = overrideData?.amountInINR || amountInINR;
    const targetUsdc = overrideData?.usdcAmount || usdcAmount;

    if (!isValidAddress(targetFreelancer) || Number(targetInr) <= 0) {
      setErrorMsg('Please enter a valid freelancer wallet address and INR amount.');
      return;
    }

    try {
      setErrorMsg('');
      setSuccessData(null);
      setIsLoading(true);

      const res = await fetch(`${API_BASE}/api/pay-upi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancerAddress: targetFreelancer,
          amountInINR: Number(targetInr),
          usdcAmount: Number(targetUsdc),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Backend transaction failed.');
      }

      setSuccessData(data);
      setCurrentStep(3); // Escrow Locked Success View

      if (!demoMode) {
        setFreelancerAddress('');
        setAmountInINR('');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to process UPI payment.');
    } finally {
      setIsLoading(false);
    }
  };

  // Hackathon demo mode one-click trigger
  const handleDemoClick = () => {
    const mockData = {
      freelancerAddress: DEMO_FREELANCER,
      amountInINR: 5000,
      usdcAmount: Math.round((5000 / CONVERSION_RATE) * 100) / 100,
    };
    setFreelancerAddress(mockData.freelancerAddress);
    setAmountInINR('5000');
    handlePayUpi(mockData);
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl text-white relative">

      {/* Demo Mode Toggle */}
      <div className="flex justify-between items-center mb-6 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className={demoMode ? 'text-violet-400 animate-pulse' : 'text-slate-400'} />
          <span className="text-xs font-semibold text-slate-300">Hackathon Demo Mode (1-Click Escrow Lock)</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={demoMode} onChange={handleDemoToggle} className="sr-only peer" />
          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white"></div>
        </label>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
            <span>UPI Escrow Checkout</span>
            <ShieldCheck size={20} className="text-violet-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1">Pay via UPI (INR) → Automatic On-Chain Smart Contract Escrow</p>
        </div>
      </div>

      {/* Error Block */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 bg-red-950/20 border border-red-500/25 text-red-300 rounded-xl p-4 text-xs mb-6">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* ========================= FORM VIEW (Step 1) ========================= */}
      {currentStep === 1 && (
        <div className="space-y-6">

          {/* Demo Mode Banner */}
          {demoMode && (
            <div className="bg-violet-950/30 border border-violet-500/30 text-violet-300 rounded-xl px-4 py-3 text-xs flex items-center justify-between animate-pulse">
              <span>🎯 Demo Mode Active — Pre-filled mock data for 1-click escrow lock</span>
              <button
                onClick={handleDemoClick}
                disabled={isLoading}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors"
              >
                Trigger 1-Click Lock
              </button>
            </div>
          )}

          {/* Freelancer Address Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Freelancer Wallet Address
            </label>
            <input
              type="text"
              value={freelancerAddress}
              onChange={(e) => setFreelancerAddress(e.target.value)}
              placeholder="0x..."
              disabled={demoMode || isLoading}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-60 font-mono"
            />
          </div>

          {/* Payment Amount Inputs */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Project Amount in INR (₹)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="number"
                  value={amountInINR}
                  onChange={(e) => setAmountInINR(e.target.value)}
                  placeholder="5000"
                  disabled={demoMode || isLoading}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-60"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-violet-400">₹ INR</span>
              </div>
              <div className="relative flex items-center justify-between bg-slate-950/30 border border-white/5 rounded-xl px-4 py-3">
                <span className="text-xs text-slate-400">Converted USDC:</span>
                <span className="text-sm font-bold text-violet-300">{usdcAmount} USDC</span>
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-500 mt-1">
              Rate: 1 USDC ≈ ₹{CONVERSION_RATE} INR
            </div>
          </div>

          {/* Dynamic UPI QR Code Section */}
          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Dynamic UPI QR Code</h3>
            <div className="bg-white p-3 rounded-2xl shadow-md">
              <QRCodeSVG value={upiUri} size={150} fgColor="#1e1b4b" level="H" includeMargin={true} />
            </div>
            <p className="text-[11px] text-slate-400 text-center font-mono break-all">
              {upiUri}
            </p>
            <button
              onClick={handleUpiAppRedirect}
              disabled={!amountInINR}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Smartphone size={14} />
              <span>Open in UPI App</span>
            </button>
          </div>

          {/* Primary Action Button: Confirm UPI Payment */}
          <button
            onClick={() => handlePayUpi()}
            disabled={!isFormValid() || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-violet-600/20 active:translate-y-[1px]"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Locking Funds On-Chain via Admin Wallet...</span>
              </>
            ) : (
              <span>Confirm UPI Payment</span>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-500">
            No Web3 wallet connection required. The relayer/admin wallet automatically executes the smart contract transaction.
          </p>
        </div>
      )}

      {/* ========================= STEP 3: Escrow Locked Success View ========================= */}
      {currentStep === 3 && successData && (
        <div className="flex flex-col items-center text-center space-y-5 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-emerald-300">Escrow Locked Success!</h3>
            <p className="text-sm text-slate-400">
              ₹{Number(successData.amountInINR).toLocaleString()} INR → {successData.usdcAmount} USDC
            </p>
          </div>

          <div className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-4 text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Project ID:</span>
              <span className="font-bold text-violet-300">#{successData.projectId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Freelancer:</span>
              <span className="font-mono text-slate-300 text-[10px]">{successData.freelancerAddress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Transaction Hash:</span>
              <a
                href={`https://etherscan.io/tx/${successData.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[10px]"
              >
                {successData.txHash.substring(0, 14)}...{successData.txHash.substring(successData.txHash.length - 8)}
                <ArrowRight size={10} />
              </a>
            </div>
          </div>

          <div className="flex gap-2 w-full pt-2">
            <button
              onClick={() => { setCurrentStep(1); setSuccessData(null); setErrorMsg(''); }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl text-xs transition-colors"
            >
              New Payment
            </button>
            {demoMode && (
              <button
                onClick={handleDemoClick}
                disabled={isLoading}
                className="flex-1 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-300 font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-1"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <span>⚡ Run Demo Again</span>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
