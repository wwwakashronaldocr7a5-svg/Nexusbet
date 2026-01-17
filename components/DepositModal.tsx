
import React, { useState } from 'react';

interface DepositModalProps {
  onClose: () => void;
  onDeposit: (amount: number, method: string) => void;
}

type PaymentMethod = 'UPI' | 'Card' | 'USDT' | 'NetBanking';

export const DepositModal: React.FC<DepositModalProps> = ({ onClose, onDeposit }) => {
  const [amount, setAmount] = useState<string>('1000');
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'selection' | 'processing' | 'gateway'>('selection');

  const presets = [500, 1000, 5000, 10000, 25000, 50000];

  const handleDeposit = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 100) return;

    setStep('processing');
    
    // Simulate Gateway Handshake
    setTimeout(() => {
      setStep('gateway');
      // Simulate User finishing payment in 3 seconds
      setTimeout(() => {
        onDeposit(val, method);
        onClose();
      }, 3000);
    }, 2000);
  };

  if (step === 'processing') {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl">
        <div className="text-center space-y-6 animate-pulse">
           <div className="w-20 h-20 border-t-4 border-emerald-500 rounded-full animate-spin mx-auto"></div>
           <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Securing Connection</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Connecting to NexusPay Gateway...</p>
           </div>
        </div>
      </div>
    );
  }

  if (step === 'gateway') {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950">
        <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in">
          <div className="p-6 bg-zinc-100 flex justify-between items-center border-b">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-black text-xs">N</div>
                <span className="font-bold text-black uppercase text-sm tracking-tighter">NexusPay Gateway</span>
             </div>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">3D Secure Enabled</span>
          </div>
          <div className="p-12 text-center space-y-8">
             <div className="space-y-2">
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Awaiting Payment</p>
                <h2 className="text-4xl font-black text-black">₹{parseFloat(amount).toLocaleString('en-IN')}</h2>
             </div>
             
             <div className="flex justify-center gap-4">
                <div className="w-12 h-8 bg-zinc-100 rounded border border-zinc-200"></div>
                <div className="w-12 h-8 bg-zinc-100 rounded border border-zinc-200"></div>
                <div className="w-12 h-8 bg-zinc-100 rounded border border-zinc-200"></div>
             </div>

             <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white animate-bounce">
                   ✓
                </div>
                <div className="text-left">
                   <p className="text-sm font-bold text-emerald-900">Authorize on your {method} App</p>
                   <p className="text-xs text-emerald-700">Please do not close this window</p>
                </div>
             </div>
          </div>
          <div className="p-4 bg-zinc-50 border-t text-center">
             <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Session expires in 04:59</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Real Money Deposit</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Instant Settlement • 0% Fees</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400">✕</button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-2">
            {['UPI', 'Card', 'USDT', 'NetBanking'].map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m as PaymentMethod)}
                className={`py-3 rounded-2xl font-black text-xs border transition-all ${
                  method === m 
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p.toString())}
                  className={`py-3 rounded-2xl font-black text-xs border transition-all ${
                    amount === p.toString()
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-lg">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-5 pl-10 pr-4 text-white font-black text-2xl focus:outline-none focus:border-emerald-500"
                placeholder="Min ₹100"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleDeposit}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-6 rounded-[2rem] transition-all shadow-xl shadow-emerald-900/20 uppercase tracking-[0.2em] text-sm active:scale-95"
            >
              Secure Deposit Now
            </button>
            <div className="flex flex-col items-center gap-2 mt-6">
               <div className="flex gap-4 opacity-30 grayscale">
                  <span className="text-xl">💳</span>
                  <span className="text-xl">🏦</span>
                  <span className="text-xl">📱</span>
                  <span className="text-xl">₿</span>
               </div>
               <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">
                  Payments encrypted by PCI-DSS Security Layer
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
