
import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { getDeepMatchAnalysis } from '../services/geminiService';

interface MatchDetailsModalProps {
  match: Match;
  onClose: () => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({ match, onClose }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      const data = await getDeepMatchAnalysis(match);
      setAnalysis(data);
      setLoading(false);
    };
    fetchAnalysis();
  }, [match]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Match Center</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{match.league}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-400">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {/* Main Display */}
          <div className="flex justify-between items-center text-center mb-10">
            <div className="flex-1 flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-900 rounded-3xl border border-zinc-800 flex items-center justify-center text-3xl mb-3 shadow-lg">{match.homeTeam[0]}</div>
              <span className="font-black text-white text-sm uppercase">{match.homeTeam}</span>
            </div>
            <div className="px-10 flex flex-col items-center">
              <span className="text-4xl font-black text-white tabular-nums tracking-widest">{match.score?.home || 0} : {match.score?.away || 0}</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase mt-2 tracking-[0.3em]">{match.status === 'Live' ? 'In Play' : 'Upcoming'}</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-900 rounded-3xl border border-zinc-800 flex items-center justify-center text-3xl mb-3 shadow-lg">{match.awayTeam[0]}</div>
              <span className="font-black text-white text-sm uppercase">{match.awayTeam}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center text-center space-y-4">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Generating tactical AI insights...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Win Probability */}
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">AI Win Probability</p>
                <div className="flex h-3 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800">
                  <div style={{ width: `${analysis.winProbability.home}%` }} className="h-full bg-emerald-500 transition-all duration-1000"></div>
                  <div style={{ width: `${analysis.winProbability.draw}%` }} className="h-full bg-zinc-600 transition-all duration-1000"></div>
                  <div style={{ width: `${analysis.winProbability.away}%` }} className="h-full bg-amber-500 transition-all duration-1000"></div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold text-zinc-400">
                  <span>Home ({analysis.winProbability.home}%)</span>
                  <span>Draw ({analysis.winProbability.draw}%)</span>
                  <span>Away ({analysis.winProbability.away}%)</span>
                </div>
              </div>

              {/* H2H */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Recent H2H Record</p>
                  <div className="space-y-2">
                    {analysis.h2h.map((h: string, i: number) => (
                      <div key={i} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 text-[10px] text-zinc-400 font-bold">
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Key Players</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keyPlayers.map((p: string, i: number) => (
                      <span key={i} className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tactical Analysis */}
              <div className="bg-black/30 p-6 rounded-3xl border border-zinc-800/50">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="text-xl">📊</span> Tactical Form Analysis
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  "{analysis.tacticalAnalysis}"
                </p>
                <div className="mt-6 flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                   <span className="text-[10px] font-black text-emerald-500 uppercase">AI Prediction Score:</span>
                   <span className="text-lg font-black text-white">{analysis.predictedScore}</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-10">
               <p className="text-xs text-zinc-600">Failed to load tactical data. Try again later.</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-zinc-900/50 border-t border-zinc-900">
           <button 
            onClick={onClose}
            className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
           >
             Close Match Center
           </button>
        </div>
      </div>
    </div>
  );
};
