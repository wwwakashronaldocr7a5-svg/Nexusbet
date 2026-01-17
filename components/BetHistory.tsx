
import React from 'react';
import { BetRecord, User } from '../types';

interface BetHistoryProps {
  history: BetRecord[];
  onClose: () => void;
  onSettle: (bet: BetRecord) => void;
}

export const BetHistory: React.FC<BetHistoryProps> = ({ history, onClose, onSettle }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-950 border-l border-zinc-800 w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Bet History</h2>
            <p className="text-xs text-zinc-500 font-bold uppercase">Track your performance</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="text-6xl mb-4">📜</div>
              <p className="text-sm font-bold uppercase tracking-widest">No bets placed yet</p>
            </div>
          ) : (
            history.map((bet) => (
              <div key={bet.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/30">
                  <div className="text-[10px] font-black text-zinc-500 uppercase">
                    {new Date(bet.timestamp).toLocaleString()}
                  </div>
                  <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    bet.status === 'Won' ? 'bg-emerald-500 text-white' : 
                    bet.status === 'Lost' ? 'bg-red-500 text-white' : 
                    'bg-zinc-700 text-zinc-300'
                  }`}>
                    {bet.status}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {bet.selections.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase truncate">{s.matchName}</p>
                        <p className="text-sm font-bold text-white">{s.teamName}</p>
                      </div>
                      <div className="text-sm font-bold text-zinc-400">@{s.odds.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-zinc-800/50 border-t border-zinc-800 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Stake</p>
                    <p className="text-sm font-black text-white">₹{bet.stake.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">
                      {bet.status === 'Won' ? 'Profit' : 'Potential Payout'}
                    </p>
                    <p className={`text-sm font-black ${bet.status === 'Won' ? 'text-emerald-400' : 'text-white'}`}>
                      ₹{(bet.winnings || bet.potentialPayout).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {bet.status === 'Pending' && (
                  <button 
                    onClick={() => onSettle(bet)}
                    className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-emerald-500/20"
                  >
                    Simulate Outcome
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
