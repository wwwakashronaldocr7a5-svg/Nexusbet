
import React, { useState } from 'react';

interface WithdrawModalProps {
  balance: number;
  onClose: () => void;
  onWithdraw: (amount: number, upiId: string) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ balance, onClose, onWithdraw }) => {
  const [amount, setAmount] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (val > balance) {
      setError('Insufficient balance');
      return;
    }

    if (!upiId.includes('@')) {
      setError('Invalid UPI ID format');
      return;
    }

    onWithdraw(val, upiId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Withdraw Funds</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Simulated INR Payout</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Available: ₹{balance.toLocaleString('en-IN')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-lg">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 pl-10 pr-4 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Destination UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 px-4 text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="username@bank"
            />
          </div>

          <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-800">
            <p className="text-[9px] text-zinc-500 uppercase font-black leading-relaxed">
              * Withdrawals require manual approval from a Nexus administrator. Approvals typically take 5-10 minutes in this simulation.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl shadow-emerald-900/20 uppercase tracking-[0.2em] text-sm active:scale-95"
          >
            Request Withdrawal
          </button>
        </form>
      </div>
    </div>
  );
};
