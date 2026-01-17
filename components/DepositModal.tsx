
import React, { useState } from 'react';

interface DepositModalProps {
  onClose: () => void;
  onDeposit: (amount: number) => void;
}

type UPIApp = 'PhonePe' | 'GPay' | 'Paytm' | 'AmazonPay';

export const DepositModal: React.FC<DepositModalProps> = ({ onClose, onDeposit }) => {
  const [amount, setAmount] = useState<string>('500');
  const [selectedUPI, setSelectedUPI] = useState<UPIApp>('PhonePe');
  const presets = [100, 500, 1000, 5000, 10000];

  const upiApps: { id: UPIApp; name: string; color: string; icon: string }[] = [
    { id: 'PhonePe', name: 'PhonePe', color: 'bg-purple-600', icon: '🟣' },
    { id: 'GPay', name: 'Google Pay', color: 'bg-blue-600', icon: '🔵' },
    { id: 'Paytm', name: 'Paytm', color: 'bg-sky-500', icon: '🏙️' },
    { id: 'AmazonPay', name: 'Amazon Pay', color: 'bg-orange-500', icon: '🛒' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      onDeposit(val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Add Funds</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Simulated INR Wallet</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Amount Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Select Deposit Amount</label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p.toString())}
                  className={`py-3 rounded-2xl font-black text-sm border transition-all ${
                    amount === p.toString()
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-lg">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-[1.25rem] py-4 pl-10 pr-4 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Choose Payment Method (UPI)</label>
            <div className="grid grid-cols-2 gap-3">
              {upiApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelectedUPI(app.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    selectedUPI === app.id
                      ? 'bg-zinc-800 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-zinc-950 border-zinc-800 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center text-lg shadow-inner`}>
                    {app.icon}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white leading-none">{app.name}</p>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Instant</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl shadow-emerald-900/20 uppercase tracking-[0.2em] text-sm active:scale-95"
            >
              Deposit via {selectedUPI}
            </button>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[9px] text-zinc-600 text-center uppercase font-black tracking-widest">
                Secure Simulated Transaction
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
