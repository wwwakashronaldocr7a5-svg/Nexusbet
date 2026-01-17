
import React, { useState, useEffect, useRef } from 'react';
import { Match, BetSelection } from '../types';

interface MatchCardProps {
  match: Match;
  onSelect: (selection: BetSelection) => void;
  activeSelections: BetSelection[];
  onOpenDetails: (match: Match) => void;
}

type Trend = 'up' | 'down' | null;

interface OddsTrendState {
  home: Trend;
  draw: Trend;
  away: Trend;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onSelect, activeSelections, onOpenDetails }) => {
  const [localScore, setLocalScore] = useState(match.score || { home: 0, away: 0 });
  const [localMinute, setLocalMinute] = useState(match.minute || Math.floor(Math.random() * 90));
  const [homeFlash, setHomeFlash] = useState(false);
  const [awayFlash, setAwayFlash] = useState(false);
  const [oddsTrends, setOddsTrends] = useState<OddsTrendState>({ home: null, draw: null, away: null });
  const [activeMarketTab, setActiveMarketTab] = useState<'Main' | 'Goals' | 'Handicap'>('Main');
  
  // Sync with prop updates
  useEffect(() => {
    if (match.score) setLocalScore(match.score);
  }, [match.score]);

  // LIVE SIMULATION ENGINE (Minor shifts for flavor)
  useEffect(() => {
    if (match.status !== 'Live') return;

    const interval = setInterval(() => {
      setLocalMinute(prev => (prev < 90 ? prev + 1 : prev));

      if (Math.random() > 0.99) {
        setOddsTrends({
          home: Math.random() > 0.5 ? 'up' : 'down',
          draw: Math.random() > 0.5 ? 'up' : 'down',
          away: Math.random() > 0.5 ? 'up' : 'down',
        });
        setTimeout(() => setOddsTrends({ home: null, draw: null, away: null }), 3000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [match.status]);

  const isSelected = (type: 'home' | 'draw' | 'away') => 
    activeSelections.some(s => s.matchId === match.id && s.selection === type);

  const OddsButton = ({ label, odds, type, teamName }: { label: string; odds: number; type: 'home' | 'draw' | 'away'; teamName: string }) => {
    const trend = oddsTrends[type];
    const selected = isSelected(type);
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect({ matchId: match.id, matchName: `${match.homeTeam} vs ${match.awayTeam}`, selection: type, odds, teamName });
        }}
        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ${
          selected 
            ? 'bg-emerald-600 border-emerald-400 text-white' 
            : 'bg-zinc-800/80 border-zinc-700/50 hover:border-zinc-500 text-zinc-300'
        }`}
      >
        <span className="text-[8px] uppercase font-black opacity-50 mb-0.5">{label}</span>
        <div className="flex items-center gap-1">
          <span className={`font-black text-sm ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : ''}`}>
            {odds.toFixed(2)}
          </span>
          {trend && <span className={`text-[8px] ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>{trend === 'up' ? '▲' : '▼'}</span>}
        </div>
      </button>
    );
  };

  const isCricket = match.sport === 'Cricket';

  return (
    <div 
      onClick={() => onOpenDetails(match)}
      className={`group relative bg-zinc-900 border rounded-2xl p-4 shadow-xl cursor-pointer transition-all duration-300 hover:bg-zinc-800/80 ${
        match.status === 'Live' ? 'border-emerald-500/20 ring-1 ring-emerald-500/10' : 'border-zinc-800'
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          {match.status === 'Live' ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-600 text-[9px] font-black text-white uppercase animate-pulse">
              Live {localMinute}'
            </div>
          ) : (
            <div className="text-[9px] font-black text-zinc-500 uppercase px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
              {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          <span className="text-[10px] font-bold text-zinc-500 truncate max-w-[120px]">{match.league}</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenDetails(match); }}
          className="w-8 h-8 rounded-full hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-emerald-500 transition-colors"
        >
          📊
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex-1 flex flex-col">
          <span className="font-black text-sm text-zinc-100 truncate">{match.homeTeam}</span>
          {isCricket && localScore && <span className="text-[10px] font-bold text-emerald-500">{localScore.home}/{match.score?.homeWickets || 0}</span>}
        </div>
        
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
          <span className={`text-xl font-black tabular-nums ${homeFlash ? 'text-emerald-400' : 'text-white'}`}>{localScore.home}</span>
          <span className="text-zinc-700 font-bold">:</span>
          <span className={`text-xl font-black tabular-nums ${awayFlash ? 'text-emerald-400' : 'text-white'}`}>{localScore.away}</span>
        </div>

        <div className="flex-1 flex flex-col text-right">
          <span className="font-black text-sm text-zinc-100 truncate">{match.awayTeam}</span>
          {isCricket && localScore && <span className="text-[10px] font-bold text-emerald-500">{localScore.away}/{match.score?.awayWickets || 0}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <OddsButton label="1" odds={match.odds.home} type="home" teamName={match.homeTeam} />
        {match.odds.draw && <OddsButton label="X" odds={match.odds.draw} type="draw" teamName="Draw" />}
        <OddsButton label="2" odds={match.odds.away} type="away" teamName={match.awayTeam} />
      </div>

      {match.commentary && (
        <div className="mt-3 text-[9px] text-zinc-600 italic truncate opacity-60">
          {match.commentary}
        </div>
      )}
    </div>
  );
};
