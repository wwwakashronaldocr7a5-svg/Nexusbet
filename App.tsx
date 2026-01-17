
import React, { useState, useMemo, useEffect } from 'react';
import { Match, SportType, BetSelection, User, BetRecord, WithdrawalRequest, HouseStats } from './types';
import { MOCK_MATCHES, SPORTS, POPULAR_LEAGUES, INITIAL_BALANCE, TEAMS_BY_SPORT } from './constants';
import { MatchCard } from './components/MatchCard';
import { BetSlip } from './components/BetSlip';
import { authService } from './services/authService';
import { fetchRealWorldMatches } from './services/geminiService';
import { AuthModal } from './components/AuthModal';
import { BetHistory } from './components/BetHistory';
import { DepositModal } from './components/DepositModal';
import { AdminPanel } from './components/AdminPanel';
import { SettingsModal } from './components/SettingsModal';
import { WithdrawModal } from './components/WithdrawModal';
import { KycModal } from './components/KycModal';

const App: React.FC = () => {
  const [activeSport, setActiveSport] = useState<SportType>('Soccer'); 
  const [activeLeague, setActiveLeague] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Live' | 'Upcoming'>('All');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [betHistory, setBetHistory] = useState<BetRecord[]>([]);
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [groundingSources, setGroundingSources] = useState<any[]>([]);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);

  const refreshUser = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setBetHistory(authService.getBetHistory(user.username));
    }
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setBetHistory(authService.getBetHistory(user.username));
    } else {
      setIsAuthModalOpen(true);
    }
  }, []);

  // Sync effect for Sport changes - Reset league
  useEffect(() => {
    setActiveLeague(null);
  }, [activeSport]);

  // REAL WORLD DATA FETCHING
  useEffect(() => {
    const syncRealWorld = async () => {
      // Throttle and check fetching status
      if (isFetching || (Date.now() - lastFetch < 15000)) return; 
      
      setIsFetching(true);
      const { matches: realMatches, sources } = await fetchRealWorldMatches(activeSport, activeLeague || undefined);
      
      if (realMatches.length > 0) {
        setMatches(prev => {
          const otherMatches = prev.filter(m => m.sport !== activeSport || (activeLeague && m.league !== activeLeague));
          return [...realMatches, ...otherMatches];
        });
        setGroundingSources(sources);
        setLastFetch(Date.now());
      }
      setIsFetching(false);
    };

    syncRealWorld();
    const interval = setInterval(syncRealWorld, 60000); 
    return () => clearInterval(interval);
  }, [activeSport, activeLeague]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const sportMatch = m.sport === activeSport;
      const leagueMatch = !activeLeague || m.league === activeLeague;
      const statusMatch = statusFilter === 'All' || m.status === statusFilter;
      return sportMatch && leagueMatch && statusMatch && m.status !== 'Finished';
    });
  }, [activeSport, activeLeague, statusFilter, matches]);

  const handleSelection = (selection: BetSelection) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    setSelections(prev => {
      const filtered = prev.filter(s => s.matchId !== selection.matchId);
      const exists = prev.find(s => s.matchId === selection.matchId && s.selection === selection.selection);
      return exists ? filtered : [...filtered, selection];
    });
  };

  const removeSelection = (matchId: string) => setSelections(prev => prev.filter(s => s.matchId !== matchId));
  const clearSlip = () => setSelections([]);

  const placeBet = (stake: number) => {
    if (!currentUser) return;
    const totalOdds = selections.reduce((acc, curr) => acc * curr.odds, 1);
    const newBet: BetRecord = {
      id: 'SLIP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      timestamp: Date.now(),
      selections: [...selections],
      stake,
      totalOdds,
      potentialPayout: stake * totalOdds,
      status: 'Pending'
    };

    const updatedUser = { ...currentUser, balance: currentUser.balance - stake };
    setCurrentUser(updatedUser);
    authService.saveUser(updatedUser);
    authService.addBetToHistory(currentUser.username, newBet);
    
    const stats = authService.getHouseStats();
    authService.updateHouseStats({
      totalTreasury: stats.totalTreasury + stake,
      totalVolume: stats.totalVolume + stake,
      totalProfit: stats.totalProfit + stake
    });

    setBetHistory(prev => [newBet, ...prev]);
    setSelections([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {isAuthModalOpen && <AuthModal onSuccess={refreshUser} />}
      {isDepositModalOpen && <DepositModal onClose={() => setIsDepositModalOpen(false)} onDeposit={(amt, m) => { authService.adjustUserBalance(currentUser!.username, amt, `Deposit: ${m}`); refreshUser(); }} />}
      {isWithdrawModalOpen && currentUser && <WithdrawModal balance={currentUser.balance} onClose={() => setIsWithdrawModalOpen(false)} onWithdraw={(amt, upi) => { authService.addWithdrawalRequest({ id: 'W'+Date.now(), username: currentUser.username, amount: amt, upiId: upi, timestamp: Date.now(), status: 'Pending' }); refreshUser(); }} />}
      {isKycModalOpen && <KycModal onClose={() => setIsKycModalOpen(false)} onSubmit={(d) => { authService.saveUser({...currentUser!, kycStatus: 'Pending', kycDetails: d}); refreshUser(); setIsKycModalOpen(false); }} />}
      {isHistoryOpen && currentUser && <BetHistory history={betHistory} onClose={() => setIsHistoryOpen(false)} onSettle={(b) => { authService.updateBetInHistory(currentUser.username, {...b, status: 'Won', winnings: b.potentialPayout}); refreshUser(); }} />}
      {isAdminPanelOpen && currentUser?.isAdmin && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} currentUser={currentUser} onRefreshUser={refreshUser} />}
      {isSettingsOpen && currentUser && <SettingsModal user={currentUser} onClose={() => setIsSettingsOpen(false)} onUpdate={refreshUser} />}

      <nav className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black text-white italic tracking-tighter cursor-pointer" onClick={() => window.location.reload()}>
              NEXUS<span className="text-emerald-500">BET</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Available</span>
                  <span className="text-emerald-400 font-black">₹{currentUser.balance.toLocaleString('en-IN')}</span>
                </div>
                <button onClick={() => setIsDepositModalOpen(true)} className="bg-emerald-500 text-black px-4 py-2 rounded-lg font-bold text-xs">Deposit</button>
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 cursor-pointer" onClick={() => setIsHistoryOpen(true)}>👤</div>
              </>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="bg-emerald-500 text-black px-6 py-2 rounded-lg font-bold text-sm">Join Now</button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-2 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
          {SPORTS.map((sport) => (
            <button key={sport.id} onClick={() => setActiveSport(sport.id)} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all border ${activeSport === sport.id ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}>
              <div className="flex items-center gap-3"><span>{sport.icon}</span>{sport.id}</div>
            </button>
          ))}
          
          <div className="mt-8 hidden lg:block border-t border-zinc-900 pt-8">
             <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-4">Verification Panel</p>
             <button onClick={() => setIsAdminPanelOpen(true)} className="w-full text-left p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-black text-zinc-500 hover:text-emerald-500 transition-colors">🛡️ Admin Command</button>
          </div>
        </aside>

        <section className="lg:col-span-7 space-y-6">
          {/* Popular Leagues Row */}
          {POPULAR_LEAGUES[activeSport].length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
               <button 
                onClick={() => setActiveLeague(null)}
                className={`whitespace-nowrap px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${!activeLeague ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
               >
                 All {activeSport}
               </button>
               {POPULAR_LEAGUES[activeSport].map((league) => (
                 <button 
                  key={league.id}
                  onClick={() => setActiveLeague(league.id)}
                  className={`whitespace-nowrap px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${activeLeague === league.id ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                 >
                   <span>{league.icon}</span>
                   {league.name}
                 </button>
               ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] ${isFetching ? 'bg-amber-500 animate-bounce' : 'bg-emerald-500 animate-pulse'}`}></span>
              {activeLeague || activeSport} Market
            </h3>
            <div className="flex items-center gap-4">
               {isFetching && <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Syncing...</span>}
               {lastFetch > 0 && (
                 <span className="text-[10px] text-zinc-600 font-bold uppercase">Last Grounded: {new Date(lastFetch).toLocaleTimeString()}</span>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredMatches.length > 0 ? (
              filteredMatches.map(match => (
                <MatchCard key={match.id} match={match} onSelect={handleSelection} activeSelections={selections} />
              ))
            ) : (
              <div className="py-20 text-center bg-zinc-900/50 rounded-[3rem] border border-dashed border-zinc-800">
                 <p className="text-4xl mb-4 grayscale opacity-50">🏟️</p>
                 <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">No live matches found in this market</p>
                 <p className="text-[10px] text-zinc-700 uppercase mt-2">Checking global exchanges...</p>
              </div>
            )}
          </div>

          {groundingSources.length > 0 && (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
               <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                 Market Data Sources
               </p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 {groundingSources.map((src, i) => (
                   <a key={i} href={src.web?.uri} target="_blank" className="text-[10px] text-zinc-500 hover:text-emerald-500 truncate bg-black/30 p-2 rounded-lg border border-zinc-800/50">
                     🔗 {src.web?.title || 'Live Exchange Data'}
                   </a>
                 ))}
               </div>
            </div>
          )}
        </section>

        <aside className="lg:col-span-3">
          <BetSlip selections={selections} onRemove={removeSelection} onClear={clearSlip} balance={currentUser?.balance || 0} onBetPlaced={placeBet} matches={matches} />
        </aside>
      </main>

      <footer className="bg-zinc-950 border-t border-zinc-800 p-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
           <div className="flex gap-8">
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">Responsibility</span>
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">Fair Play</span>
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">SSL Encrypted</span>
           </div>
           <p className="text-zinc-800 text-[8px] font-black uppercase tracking-[0.6em]">Nexus Bet © 2024 International Gaming Group</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
