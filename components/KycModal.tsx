
import React, { useState } from 'react';
import { User } from '../types';

interface KycModalProps {
  onClose: () => void;
  onSubmit: (details: NonNullable<User['kycDetails']>) => void;
}

export const KycModal: React.FC<KycModalProps> = ({ onClose, onSubmit }) => {
  const [fullName, setFullName] = useState('');
  const [idType, setIdType] = useState('Aadhar');
  const [idNumber, setIdNumber] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !idNumber || !agreed) return;
    onSubmit({ fullName, idType, idNumber });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Identity Verification</h2>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Required for Real Money Withdrawals</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex gap-4">
             <span className="text-2xl">🛡️</span>
             <p className="text-xs text-emerald-400 leading-relaxed font-medium">
               To comply with anti-money laundering regulations, we require a one-time identity check before you can withdraw your winnings.
             </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Full Legal Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500"
                placeholder="As per Government ID"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">ID Type</label>
                <select 
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option>Aadhar Card</option>
                  <option>PAN Card</option>
                  <option>Passport</option>
                  <option>Driver's License</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">ID Number</label>
                <input 
                  type="text" 
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="ID Number"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-emerald-500" 
              />
              <span className="text-[10px] text-zinc-500 font-bold uppercase group-hover:text-zinc-300 transition-colors">
                I certify that the information provided is accurate and belongs to me. I understand that false information will lead to a permanent account ban.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!agreed || !fullName || !idNumber}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 text-black font-black py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-[0.2em] text-sm active:scale-95"
          >
            Submit for Verification
          </button>
        </form>
      </div>
    </div>
  );
};
