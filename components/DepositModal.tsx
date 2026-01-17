
import React, { useState, useEffect } from 'react';

interface DepositModalProps {
  onClose: () => void;
  onDeposit: (amount: number, method: string) => void;
}

type PaymentStep = 'amount' | 'gateway' | 'verifying' | 'success';

export const DepositModal: React.FC<DepositModalProps> = ({ onClose, onDeposit }) => {
  const [amount, setAmount] = useState<string>('1000');
  const [step, setStep] = useState<PaymentStep>('amount');
  const [method, setMethod] = useState<string>('UPI');
  const [utr, setUtr] = useState('');
  const [timer, setTimer] = useState(300); // 5 minute expiry

  useEffect(() => {
    let interval: any;
    if (step === 'gateway') {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleInitiateGateway = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 100) return;
    setStep('gateway');
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (utr.length < 12) return;
    
    setStep('verifying');
    // Simulate API Webhook Latency
    setTimeout(() => {
      onDeposit(parseFloat(amount), method);
      setStep('success');
      setTimeout(onClose, 2000);
    }, 3500);
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
        <div className="text-center space-y-4 animate-in zoom-in">
           <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_50px_rgba(16,185,129,0.4)]">✓</div>
           <h2 className="text-3xl font-black text-white uppercase italic">Payment Received</h2>
           <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">₹{parseFloat(amount).toLocaleString()} added to vault</p>
        </div>
      </div>
    );
  }

  if (step === 'verifying') {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
        <div className="text-center space-y-6">
           <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🏦</div>
           </div>
           <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Verifying Transaction</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Awaiting Bank Confirmation...</p>
           </div>
           <div className="max-w-xs mx-auto bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-left">
              <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase mb-2">
                 <span>UTR / Ref No</span>
                 <span className="text-emerald-500">{utr}</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 animate-[loading_4s_ease-in-out_infinite] w-1/3"></div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {step === 'amount' ? (
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
               <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Top Up Wallet</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Instant Settlement Gateway</p>
               </div>
               <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">✕</button>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000, 5000, 10000, 25000].map(p => (
                    <button 
                      key={p} 
                      onClick={() => setAmount(p.toString())}
                      className={`py-3 rounded-2xl font-black text-xs transition-all border ${amount === p.toString() ? 'bg-emerald-500 border-emerald-400 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                    >
                      ₹{p.toLocaleString()}
                    </button>
                  ))}
               </div>

               <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-2xl">₹</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl py-6 pl-12 pr-6 text-white text-3xl font-black focus:outline-none focus:border-emerald-500 transition-all"
                  />
               </div>

               <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-xl">🎁</div>
                  <div>
                     <p className="text-xs font-black text-emerald-400 uppercase tracking-tight">100% First Deposit Bonus</p>
                     <p className="text-[10px] text-zinc-500 font-medium">Extra ₹{amount} will be added to bonus wallet</p>
                  </div>
               </div>

               <button 
                onClick={handleInitiateGateway}
                className="w-full bg-white text-black font-black py-6 rounded-3xl uppercase tracking-widest text-sm shadow-xl hover:bg-zinc-200 transition-all active:scale-95"
               >
                 Go to Payment Gateway
               </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[600px]">
            <div className="p-6 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center font-black text-emerald-500 border border-emerald-500/30">N</div>
                  <span className="font-black text-white uppercase text-xs tracking-tighter">Nexus Secure Pay</span>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-zinc-600 uppercase">Expires In</p>
                  <p className={`text-xs font-mono font-black ${timer < 60 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatTime(timer)}</p>
               </div>
            </div>

            <div className="flex-1 overflow-auto p-8 space-y-8 text-center">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Amount to Pay</p>
                  <h2 className="text-4xl font-black text-white">₹{parseFloat(amount).toLocaleString()}</h2>
               </div>

               {/* QR Code Simulation */}
               <div className="relative w-48 h-48 mx-auto bg-white p-2 rounded-3xl shadow-2xl shadow-emerald-500/10">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=nexusbet@bank%26am=${amount}%26cu=INR`} 
                    alt="Payment QR"
                    className="w-full h-full rounded-2xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-white/90 rounded-3xl cursor-pointer">
                     <p className="text-[10px] font-black text-black uppercase px-4">Open in Wallet</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Or Select App</p>
                  <div className="grid grid-cols-4 gap-4">
                     {['GPay', 'PhonePe', 'Paytm', 'UPI'].map(app => (
                       <button key={app} className="flex flex-col items-center gap-2 group">
                          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-xl group-hover:border-emerald-500 transition-all group-active:scale-90">
                             {app === 'GPay' ? '🔵' : app === 'PhonePe' ? '🟣' : app === 'Paytm' ? '🟦' : '💳'}
                          </div>
                          <span className="text-[8px] font-black text-zinc-500 uppercase">{app}</span>
                       </button>
                     ))}
                  </div>
               </div>

               <form onSubmit={handleSubmitVerification} className="pt-4 border-t border-zinc-900 space-y-4">
                  <div className="text-left">
                     <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Enter Ref No / UTR (12 Digits)</label>
                     <input 
                       type="text" 
                       value={utr}
                       onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                       placeholder="1234 5678 9012"
                       required
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-white font-mono text-center tracking-[0.2em] focus:outline-none focus:border-emerald-500"
                     />
                  </div>
                  <button 
                    type="submit"
                    disabled={utr.length < 12}
                    className="w-full bg-emerald-500 text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-20 transition-all"
                  >
                    Confirm Payment
                  </button>
               </form>
            </div>
          </div>
        )}
        
        <div className="p-4 bg-zinc-900/50 text-center border-t border-zinc-900">
           <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">Secure 256-Bit SSL Gateway • Nexus Group</p>
        </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};
