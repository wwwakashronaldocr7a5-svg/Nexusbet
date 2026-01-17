
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

  useEffect(() => {
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
      }, 4000);
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
        }`}
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
        {trend && (
          <div className={`absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-1000 ${
            trend === 'up' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}></div>
        )}
      </button>
    );
  };

  const isCricket = match.sport === 'Cricket';

  return (
    <div className={`group relative bg-zinc-900 border rounded-2xl p-4 shadow-xl transition-all duration-500 ${
      isCricket ? 'border-emerald-500/30' : 'border-zinc-800'
    } hover:border-zinc-700`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800">
            <span className={`h-1.5 w-1.5 rounded-full ${match.status === 'Live' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></span>
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
              {match.status === 'Live' ? 'Grounded Live' : 'Market Ready'}
            </span>
          </div>
          {isCricket && (
            <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20">IPL 2024</span>
          )}
        </div>
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{match.league}</span>
      </div>

      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex-1 text-center sm:text-left">
          <p className="font-black text-sm text-zinc-200 uppercase tracking-tight leading-none truncate mb-1">{match.homeTeam}</p>
          {isCricket && match.score && (
            <p className="text-[10px] font-bold text-zinc-500 italic">
              {match.score.home}/{match.score.homeWickets || 0} ({match.score.homeOvers || '0.0'})
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-center justify-center min-w-[100px]">
          {match.score ? (
            <div className="relative flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800/80 shadow-2xl">
              <span className={`text-2xl font-black tabular-nums ${homeFlash ? 'text-emerald-400 scale-110' : 'text-white'}`}>
                {match.score.home}
              </span>
              <span className="text-zinc-700 font-bold opacity-30">-</span>
              <span className={`text-2xl font-black tabular-nums ${awayFlash ? 'text-emerald-400 scale-110' : 'text-white'}`}>
                {match.score.away}
              </span>
            </div>
          ) : (
             <p className="text-[10px] text-zinc-400 font-black tabular-nums">
              {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </p>
          )}
        </div>

        <div className="flex-1 text-center sm:text-right">
          <p className="font-black text-sm text-zinc-200 uppercase tracking-tight leading-none truncate mb-1">{match.awayTeam}</p>
          {isCricket && match.score && (
            <p className="text-[10px] font-bold text-zinc-500 italic">
              {match.score.away}/{match.score.awayWickets || 0} ({match.score.awayOvers || '0.0'})
            </p>
          )}
        </div>
      </div>

      <div className={`grid ${match.odds.draw ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
        <OddsButton label="1" odds={match.odds.home} type="home" teamName={match.homeTeam} />
        {match.odds.draw && (
          <OddsButton label="X" odds={match.odds.draw} type="draw" teamName="Draw" />
        )}
        <OddsButton label="2" odds={match.odds.away} type="away" teamName={match.awayTeam} />
      </div>

      {match.commentary && (
        <div className="mt-4 p-2 bg-black/40 rounded-lg border border-zinc-800/50">
           <p className="text-[9px] text-zinc-500 leading-tight italic">
             <span className="text-emerald-500 font-black mr-1 uppercase">Commentary:</span>
             {match.commentary}
           </p>
        </div>
      )}
    </div>
  );
};
