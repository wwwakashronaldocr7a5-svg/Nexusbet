
import React, { useState, useMemo } from 'react';
import { BetSelection } from '../types';

interface BetSlipProps {
  selections: BetSelection[];
  onRemove: (matchId: string) => void;
  onClear: () => void;
  balance: number;
  onBetPlaced: (totalStake: number) => void;
}

export const BetSlip: React.FC<BetSlipProps> = ({ selections, onRemove, onClear, balance, onBetPlaced }) => {
  const [stake, setStake] = useState<string>('500');

  const totalOdds = useMemo(() => {
    return selections.reduce((acc, curr) => acc * curr.odds, 1);
  }, [selections]);

  const stakeValue = useMemo(() => parseFloat(stake) || 0, [stake]);

  const potentialPayout = useMemo(() => {
    return stakeValue * totalOdds;
  }, [stakeValue, totalOdds]);

  const hasInsufficientFunds = useMemo(() => {
    return stakeValue > balance;
  }, [stakeValue, balance]);

  if (selections.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center sticky top-4">
        <div className="text-4xl mb-4">🎫</div>
        <h3 className="text-lg font-bold text-white mb-2">Your betslip is empty</h3>
        <p className="text-zinc-500 text-sm">Add matches to start building your bet.</p>
      </div>
    );
  }

  const handlePlaceBet = () => {
    if (isNaN(stakeValue) || stakeValue <= 0) return;
    if (hasInsufficientFunds) return;
    
    onBetPlaced(stakeValue);
  };

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or numbers only
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setStake(value);
    }
  };

  const setMaxStake = () => {
    setStake(balance.toFixed(2));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden sticky top-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-emerald-600 px-4 py-3 flex justify-between items-center shadow-md">
        <h3 className="font-bold text-white flex items-center gap-2">
          Bet Slip <span className="bg-white/20 text-xs rounded-full px-2 py-0.5">{selections.length}</span>
        </h3>
        <button onClick={onClear} className="text-xs text-white/70 hover:text-white transition-colors font-bold uppercase tracking-tighter">Clear All</button>
      </div>

      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        {selections.map((s) => (
          <div key={s.matchId} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 relative group transition-all hover:bg-zinc-800">
            <button 
              onClick={() => onRemove(s.matchId)}
              className="absolute top-2 right-2 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              ✕
            </button>
            <p className="text-[10px] text-zinc-500 font-bold uppercase truncate pr-6">{s.matchName}</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm font-semibold text-white">{s.teamName}</span>
              <span className="text-sm font-bold text-emerald-500">{s.odds.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-zinc-800 border-t border-zinc-700/50 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase">
          <span>Total Odds</span>
          <span className="text-white text-lg font-black">{totalOdds.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Stake Amount</label>
            <button 
              onClick={setMaxStake}
              className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-tighter"
            >
              Set Max
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-lg">₹</span>
            <input 
              type="text"
              inputMode="decimal"
              value={stake}
              onChange={handleStakeChange}
              className={`w-full bg-zinc-900 border rounded-lg py-3 pl-8 pr-4 text-white font-black text-xl focus:outline-none transition-all ${
                hasInsufficientFunds 
                ? 'border-red-500 ring-1 ring-red-500/50' 
                : 'border-zinc-700 focus:border-emerald-500'
              }`}
              placeholder="0.00"
            />
          </div>
          {hasInsufficientFunds && (
            <p className="text-[10px] font-bold text-red-500 uppercase animate-pulse">
              ⚠️ Insufficient funds (Available: ₹{balance.toLocaleString('en-IN')})
            </p>
          )}
        </div>

        <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Potential Payout</span>
            <span className="text-2xl font-black text-emerald-400">
              ₹{potentialPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <button 
          onClick={handlePlaceBet}
          disabled={hasInsufficientFunds || stakeValue <= 0}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-widest text-sm active:scale-95"
        >
          {hasInsufficientFunds ? 'Insufficient Funds' : 'Place Bet'}
        </button>
      </div>
    </div>
  );
};
