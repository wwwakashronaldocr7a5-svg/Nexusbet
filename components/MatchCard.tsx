
import React, { useState, useEffect, useRef } from 'react';
import { Match, BetSelection } from '../types';

interface MatchCardProps {
  match: Match;
  onSelect: (selection: BetSelection) => void;
  activeSelections: BetSelection[];
}

type Trend = 'up' | 'down' | null;

interface OddsTrendState {
  home: Trend;
  draw: Trend;
  away: Trend;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onSelect, activeSelections }) => {
  const [homeFlash, setHomeFlash] = useState(false);
  const [awayFlash, setAwayFlash] = useState(false);
  const [oddsTrends, setOddsTrends] = useState<OddsTrendState>({ home: null, draw: null, away: null });
  const [isSyncing, setIsSyncing] = useState(false);
  
  const prevScore = useRef(match.score);
  const prevOdds = useRef(match.odds);

  // Simulated "Market Fetching" Mechanism
  useEffect(() => {
    const fetchSimulation = setInterval(() => {
      // Briefly trigger a "syncing" state to simulate data retrieval
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 800);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(fetchSimulation);
  }, []);

  useEffect(() => {
    // Score update detection
    if (match.score && prevScore.current) {
      if (match.score.home > prevScore.current.home) {
        setHomeFlash(true);
        setTimeout(() => setHomeFlash(false), 1000);
      }
      if (match.score.away > prevScore.current.away) {
        setAwayFlash(true);
        setTimeout(() => setAwayFlash(false), 1000);
      }
    }
    prevScore.current = match.score;

    // Odds trend detection
    const threshold = 0.01;
    const newTrends: OddsTrendState = { home: null, draw: null, away: null };
    let changed = false;

    if (Math.abs(match.odds.home - prevOdds.current.home) >= threshold) {
      newTrends.home = match.odds.home > prevOdds.current.home ? 'up' : 'down';
      changed = true;
    }
    if (match.odds.draw && prevOdds.current.draw && Math.abs(match.odds.draw - prevOdds.current.draw) >= threshold) {
      newTrends.draw = match.odds.draw > prevOdds.current.draw ? 'up' : 'down';
      changed = true;
    }
    if (Math.abs(match.odds.away - prevOdds.current.away) >= threshold) {
      newTrends.away = match.odds.away > prevOdds.current.away ? 'up' : 'down';
      changed = true;
    }

    if (changed) {
      setOddsTrends(newTrends);
      const timer = setTimeout(() => {
        setOddsTrends({ home: null, draw: null, away: null });
      }, 4000); // Keep trend visible for 4s
      return () => clearTimeout(timer);
    }
    
    prevOdds.current = match.odds;
  }, [match.score, match.odds]);

  const isSelected = (type: 'home' | 'draw' | 'away') => 
    activeSelections.some(s => s.matchId === match.id && s.selection === type);

  const OddsButton = ({ label, odds, type, teamName }: { label: string; odds: number; type: 'home' | 'draw' | 'away'; teamName: string }) => {
    const trend = oddsTrends[type];
    
    return (
      <button
        onClick={() => onSelect({ matchId: match.id, matchName: `${match.homeTeam} vs ${match.awayTeam}`, selection: type, odds, teamName })}
        className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 border-2 overflow-hidden ${
          isSelected(type) 
            ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' 
            : 'bg-zinc-800 border-zinc-700/50 hover:border-zinc-500 text-zinc-300'
        } ${isSyncing ? 'scale-[0.98]' : 'scale-100'}`}
      >
        <span className="text-[9px] uppercase font-black opacity-40 mb-0.5">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-base font-black transition-colors duration-500 ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : ''
          }`}>
            {odds.toFixed(2)}
          </span>
          {trend && (
            <span className={`text-[10px] animate-bounce ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend === 'up' ? '▲' : '▼'}
            </span>
          )}
        </div>
        
        {/* Trend Indicator Background Pulse */}
        {trend && (
          <div className={`absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-1000 ${
            trend === 'up' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}></div>
        )}

        {/* Syncing Overlay (Scanline Effect) */}
        {isSyncing && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] w-full -top-full animate-[scan_0.8s_ease-in-out]"></div>
        )}
      </button>
    );
  };

  return (
    <div className={`group relative bg-zinc-900 border rounded-2xl p-4 shadow-xl transition-all duration-500 ${
      match.isNew ? 'border-emerald-500 ring-4 ring-emerald-500/10 scale-[1.01]' : 'border-zinc-800 hover:border-zinc-700 hover:shadow-emerald-900/5'
    }`}>
      {/* Top Sync Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800">
            <span className={`h-1.5 w-1.5 rounded-full ${match.status === 'Live' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></span>
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
              {isSyncing ? 'Syncing Market...' : 'Market Live'}
            </span>
          </div>
          {match.isNew && (
            <span className="bg-emerald-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg shadow-emerald-500/20">NEW MARKET</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{match.league}</span>
          {match.status === 'Live' && (
            <div className="flex items-center gap-1.5 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              <span className="text-[9px] font-black text-rose-500 uppercase italic">Live {match.minute}'</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex-1">
          <p className="font-black text-sm text-zinc-200 uppercase tracking-tight leading-none truncate">{match.homeTeam}</p>
        </div>
        
        <div className="flex flex-col items-center justify-center min-w-[90px]">
          {match.score ? (
            <div className="relative flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800/80 shadow-2xl">
              <span className={`text-2xl font-black transition-all duration-500 inline-block tabular-nums ${
                homeFlash ? 'text-emerald-400 scale-125 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'text-white'
              }`}>
                {match.score.home}
              </span>
              <span className="text-zinc-700 font-bold opacity-30">:</span>
              <span className={`text-2xl font-black transition-all duration-500 inline-block tabular-nums ${
                awayFlash ? 'text-emerald-400 scale-125 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'text-white'
              }`}>
                {match.score.away}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
               <p className="text-[10px] text-zinc-400 font-black tabular-nums">
                {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </p>
               <div className="h-0.5 w-12 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-1/3 animate-[loading_2s_infinite]"></div>
               </div>
            </div>
          )}
        </div>

        <div className="flex-1 text-right">
          <p className="font-black text-sm text-zinc-200 uppercase tracking-tight leading-none truncate">{match.awayTeam}</p>
        </div>
      </div>

      <div className={`grid ${match.odds.draw ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
        <OddsButton label="Home" odds={match.odds.home} type="home" teamName={match.homeTeam} />
        {match.odds.draw && (
          <OddsButton label="Draw" odds={match.odds.draw} type="draw" teamName="Draw" />
        )}
        <OddsButton label="Away" odds={match.odds.away} type="away" teamName={match.awayTeam} />
      </div>

      <style>{`
        @keyframes scan {
          from { top: -100%; }
          to { top: 100%; }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};
