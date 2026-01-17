
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
  const [localScore, setLocalScore] = useState(match.score || { home: 0, away: 0 });
  const [localMinute, setLocalMinute] = useState(match.minute || 0);
  const [homeFlash, setHomeFlash] = useState(false);
  const [awayFlash, setAwayFlash] = useState(false);
  const [oddsTrends, setOddsTrends] = useState<OddsTrendState>({ home: null, draw: null, away: null });
  const [activeMarketTab, setActiveMarketTab] = useState<'Main' | 'Goals' | 'Handicap'>('Main');
  
  const prevOdds = useRef(match.odds);

  // Sync with prop updates but preserve local simulation state
  useEffect(() => {
    if (match.score) setLocalScore(match.score);
    if (match.minute) setLocalMinute(match.minute);
  }, [match.score, match.minute]);

  // LIVE SIMULATION ENGINE
  useEffect(() => {
    if (match.status !== 'Live') return;

    const interval = setInterval(() => {
      // 1. Increment Clock
      setLocalMinute(prev => (prev < 90 ? prev + 1 : prev));

      // 2. Random Score Simulation (Very low chance per tick)
      if (Math.random() > 0.995) {
        const isHome = Math.random() > 0.5;
        if (isHome) {
          setLocalScore(prev => ({ ...prev, home: prev.home + 1 }));
          setHomeFlash(true);
          setTimeout(() => setHomeFlash(false), 2000);
        } else {
          setLocalScore(prev => ({ ...prev, away: prev.away + 1 }));
          setAwayFlash(true);
          setTimeout(() => setAwayFlash(false), 2000);
        }
      }

      // 3. Random Odds Volatility
      if (Math.random() > 0.95) {
        setOddsTrends({
          home: Math.random() > 0.5 ? 'up' : 'down',
          draw: Math.random() > 0.5 ? 'up' : 'down',
          away: Math.random() > 0.5 ? 'up' : 'down',
        });
        setTimeout(() => setOddsTrends({ home: null, draw: null, away: null }), 3000);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [match.status]);

  const isSelected = (type: 'home' | 'draw' | 'away') => 
    activeSelections.some(s => s.matchId === match.id && s.selection === type);

  const OddsButton = ({ label, odds, type, teamName, size = 'md' }: { label: string; odds: number; type: 'home' | 'draw' | 'away'; teamName: string, size?: 'sm' | 'md' }) => {
    const trend = oddsTrends[type];
    const selected = isSelected(type);
    
    return (
      <button
        onClick={() => onSelect({ matchId: match.id, matchName: `${match.homeTeam} vs ${match.awayTeam}`, selection: type, odds, teamName })}
        className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 border-2 overflow-hidden active:scale-95 ${
          selected 
            ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' 
            : 'bg-zinc-800/80 border-zinc-700/50 hover:border-zinc-500 text-zinc-300'
        } ${size === 'sm' ? 'py-1.5' : 'py-3'}`}
      >
        <span className="text-[8px] uppercase font-black opacity-40 mb-0.5">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`font-black transition-colors duration-500 ${size === 'sm' ? 'text-xs' : 'text-base'} ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : ''
          }`}>
            {(odds + (trend === 'up' ? 0.05 : trend === 'down' ? -0.05 : 0)).toFixed(2)}
          </span>
          {trend && (
            <span className={`text-[8px] animate-bounce ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend === 'up' ? '▲' : '▼'}
            </span>
          )}
        </div>
      </button>
    );
  };

  const isCricket = match.sport === 'Cricket';

  return (
    <div className={`group relative bg-zinc-900 border rounded-3xl p-5 shadow-2xl transition-all duration-500 ${
      match.status === 'Live' ? 'border-emerald-500/20 ring-1 ring-emerald-500/10' : 'border-zinc-800'
    } hover:border-zinc-700`}>
      
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
            match.status === 'Live' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-zinc-950 border-zinc-800 text-zinc-600'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${match.status === 'Live' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`}></span>
            <span className="text-[9px] font-black uppercase tracking-widest">
              {match.status === 'Live' ? `${localMinute}' LIVE` : 'UPCOMING'}
            </span>
          </div>
          {match.isNew && (
            <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-500/20 uppercase">Top Event</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{match.league}</span>
          <button className="text-zinc-700 hover:text-zinc-400">📊</button>
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <p className="font-black text-sm text-zinc-200 uppercase tracking-tight truncate mb-1">{match.homeTeam}</p>
          {isCricket && localScore && (
            <p className="text-[10px] font-bold text-emerald-500 italic">
              {localScore.home}/{match.score?.homeWickets || 0} ({match.score?.homeOvers || '0.0'})
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-center justify-center min-w-[120px]">
          {match.status === 'Live' ? (
            <div className="flex items-center gap-4 bg-black/40 px-5 py-2.5 rounded-2xl border border-white/5 backdrop-blur-md">
              <span className={`text-3xl font-black tabular-nums transition-all ${homeFlash ? 'text-emerald-400 scale-125' : 'text-white'}`}>
                {localScore.home}
              </span>
              <span className="text-zinc-700 font-bold opacity-30">:</span>
              <span className={`text-3xl font-black tabular-nums transition-all ${awayFlash ? 'text-emerald-400 scale-125' : 'text-white'}`}>
                {localScore.away}
              </span>
            </div>
          ) : (
             <div className="text-center">
                <p className="text-xs text-white font-black tabular-nums">
                  {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1">Starts Soon</p>
             </div>
          )}
        </div>

        <div className="flex-1 text-right">
          <p className="font-black text-sm text-zinc-200 uppercase tracking-tight truncate mb-1">{match.awayTeam}</p>
          {isCricket && localScore && (
            <p className="text-[10px] font-bold text-emerald-500 italic">
              {localScore.away}/{match.score?.awayWickets || 0} ({match.score?.awayOvers || '0.0'})
            </p>
          )}
        </div>
      </div>

      {/* Market Tabs (Parimatch Style) */}
      <div className="flex gap-1 mb-4 bg-black/30 p-1 rounded-xl border border-zinc-800">
        {['Main', 'Goals', 'Handicap'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveMarketTab(tab as any)}
            className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeMarketTab === tab ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Betting Markets Grid */}
      <div className="space-y-2">
        {activeMarketTab === 'Main' && (
          <div className={`grid ${match.odds.draw ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
            <OddsButton label="1" odds={match.odds.home} type="home" teamName={match.homeTeam} />
            {match.odds.draw && (
              <OddsButton label="X" odds={match.odds.draw} type="draw" teamName="Draw" />
            )}
            <OddsButton label="2" odds={match.odds.away} type="away" teamName={match.awayTeam} />
          </div>
        )}

        {activeMarketTab === 'Goals' && (
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-zinc-800/50 border border-zinc-800 p-2 rounded-xl flex justify-between items-center px-4 hover:border-zinc-600 group">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Over 2.5</span>
              <span className="text-xs font-black text-emerald-500">1.88</span>
            </button>
            <button className="bg-zinc-800/50 border border-zinc-800 p-2 rounded-xl flex justify-between items-center px-4 hover:border-zinc-600 group">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Under 2.5</span>
              <span className="text-xs font-black text-emerald-500">2.05</span>
            </button>
            <button className="bg-zinc-800/50 border border-zinc-800 p-2 rounded-xl flex justify-between items-center px-4 hover:border-zinc-600 group">
              <span className="text-[9px] font-black text-zinc-500 uppercase">BTTS (Yes)</span>
              <span className="text-xs font-black text-emerald-500">1.65</span>
            </button>
            <button className="bg-zinc-800/50 border border-zinc-800 p-2 rounded-xl flex justify-between items-center px-4 hover:border-zinc-600 group">
              <span className="text-[9px] font-black text-zinc-500 uppercase">BTTS (No)</span>
              <span className="text-xs font-black text-emerald-500">2.20</span>
            </button>
          </div>
        )}

        {activeMarketTab === 'Handicap' && (
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-zinc-800/20 border border-zinc-800/50 rounded-xl p-3 text-center">
              <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em]">Handicap Markets Coming Soon</p>
            </div>
          </div>
        )}
      </div>

      {match.commentary && (
        <div className="mt-4 p-3 bg-black/40 rounded-2xl border border-zinc-800/50 flex items-start gap-3">
           <span className="text-lg">📢</span>
           <p className="text-[10px] text-zinc-500 leading-tight italic py-1">
             <span className="text-emerald-500 font-black mr-1 uppercase">Flash:</span>
             {match.commentary}
           </p>
        </div>
      )}
    </div>
  );
};
