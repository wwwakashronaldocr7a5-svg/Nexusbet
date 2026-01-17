
import React, { useState, useMemo, useEffect } from 'react';
import { Match, SportType, BetSelection, User, AIInsight, BetRecord, WithdrawalRequest, HouseStats, KycStatus } from './types';
import { MOCK_MATCHES, SPORTS, INITIAL_BALANCE, TEAMS_BY_SPORT } from './constants';
import { MatchCard } from './components/MatchCard';
import { BetSlip } from './components/BetSlip';
import { getMatchInsight } from './services/geminiService';
import { authService } from './services/authService';
import { AuthModal } from './components/AuthModal';
import { BetHistory } from './components/BetHistory';
import { DepositModal } from './components/DepositModal';
import { AdminPanel } from './components/AdminPanel';
import { SettingsModal } from './components/SettingsModal';
import { WithdrawModal } from './components/WithdrawModal';
import { KycModal } from './components/KycModal';

const App: React.FC = () => {
  const [activeSport, setActiveSport] = useState<SportType>('Soccer');
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

  // Autonomous Fixture Pipeline with Settlement Engine
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      setMatches(currentMatches => {
        let updatedMatches = [...currentMatches];
        const now = Date.now();
        
        // Randomly spawn new matches
        if (Math.random() < 0.15) {
          const randomSport = SPORTS[Math.floor(Math.random() * SPORTS.length)].id;
          const { teams, leagues } = TEAMS_BY_SPORT[randomSport];
          let home = teams[Math.floor(Math.random() * teams.length)];
          let away = teams[Math.floor(Math.random() * teams.length)];
          while (home === away) away = teams[Math.floor(Math.random() * teams.length)];
          const isImmediate = Math.random() < 0.20;
          const startTime = isImmediate ? new Date(now).toISOString() : new Date(now + (Math.random() * 3600000)).toISOString();

          const newMatch: Match = {
            id: Math.random().toString(36).substr(2, 9),
            sport: randomSport,
            league: leagues[Math.floor(Math.random() * leagues.length)],
            homeTeam: home,
            awayTeam: away,
            startTime,
            status: isImmediate ? 'Live' : 'Upcoming',
            minute: isImmediate ? 0 : undefined,
            score: isImmediate ? { home: 0, away: 0 } : undefined,
            odds: {
              home: 1.5 + Math.random() * 2,
              draw: randomSport === 'Soccer' ? 2.5 + Math.random() * 2 : undefined,
              away: 1.5 + Math.random() * 2
            },
            isNew: true
          };
          updatedMatches.unshift(newMatch);
          setTimeout(() => setMatches(prev => prev.map(m => m.id === newMatch.id ? { ...m, isNew: false } : m)), 20000);
        }

        return updatedMatches.map(match => {
          if (match.status === 'Upcoming' && new Date(match.startTime).getTime() <= now) {
            return { ...match, status: 'Live', minute: 0, score: { home: 0, away: 0 } };
          }
          if (match.status === 'Live') {
            const newMinute = (match.minute || 0) + 1;
            let newScore = match.score ? { ...match.score } : { home: 0, away: 0 };
            
            // Goal Logic
            if (Math.random() < 0.04) {
              if (Math.random() > 0.5) newScore.home += 1; else newScore.away += 1;
            }
            
            // Odds Fluctuation
            const fluctuate = (odd: number) => Math.max(1.01, odd + ((Math.random() - 0.5) * 0.15));
            const newOdds = {
              home: fluctuate(match.odds.home),
              draw: match.odds.draw ? fluctuate(match.odds.draw) : undefined,
              away: fluctuate(match.odds.away),
            };

            // Automatic Match Settlement Logic
            if (newMinute >= 95) {
              const finishedMatch: Match = { ...match, minute: 95, score: newScore, status: 'Finished' };
              // Critical: Auto-settle all bets for all users for this match
              authService.autoSettleBets(finishedMatch);
              // Trigger a state refresh for current user
              setTimeout(refreshUser, 500);
              return finishedMatch;
            }

            return { ...match, minute: newMinute, score: newScore, odds: newOdds };
          }
          return match;
        });
      });
    }, 5000);
    return () => clearInterval(simulationInterval);
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const sportMatch = m.sport === activeSport;
      const statusMatch = statusFilter === 'All' || m.status === statusFilter;
      return sportMatch && statusMatch && m.status !== 'Finished';
    });
  }, [activeSport, statusFilter, matches]);

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

  const handleRealMoneyDeposit = (amount: number, method: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, balance: currentUser.balance + amount };
    setCurrentUser(updatedUser);
    authService.saveUser(updatedUser);
    
    authService.logTransaction({
      id: 'DEP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      type: 'Deposit',
      amount,
      status: 'Approved',
      timestamp: Date.now(),
      method,
      details: `User: ${currentUser.username} | Automated Gateway`
    });
  };

  const handleKycSubmit = (details: NonNullable<User['kycDetails']>) => {
    if (!currentUser) return;
    const updatedUser: User = { ...currentUser, kycStatus: 'Pending', kycDetails: details };
    setCurrentUser(updatedUser);
    authService.saveUser(updatedUser);
    setIsKycModalOpen(false);
  };

  const initiateWithdrawal = () => {
    if (!currentUser) return;
    if (currentUser.kycStatus === 'Verified') setIsWithdrawModalOpen(true);
    else if (currentUser.kycStatus === 'Pending') alert('Account Verification Pending.');
    else setIsKycModalOpen(true);
  };

  const handleWithdrawalRequest = (amount: number, upiId: string) => {
    if (!currentUser) return;
    const request: WithdrawalRequest = {
      id: 'WIT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      username: currentUser.username,
      amount,
      upiId,
      timestamp: Date.now(),
      status: 'Pending'
    };
    const updatedUser = { ...currentUser, balance: currentUser.balance - amount };
    setCurrentUser(updatedUser);
    authService.saveUser(updatedUser);
    authService.addWithdrawalRequest(request);
  };

  const settleBetManually = (bet: BetRecord) => {
    if (!currentUser) return;
    // Manual override simulation if needed
    const won = Math.random() > 0.5;
    const updatedBet: BetRecord = { ...bet, status: won ? 'Won' : 'Lost', winnings: won ? bet.potentialPayout : 0 };
    if (won) {
      const updatedUser = { ...currentUser, balance: currentUser.balance + bet.potentialPayout };
      setCurrentUser(updatedUser);
      authService.saveUser(updatedUser);
    }
    authService.updateBetInHistory(currentUser.username, updatedBet);
    refreshUser();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isAuthModalOpen && <AuthModal onSuccess={(u) => { setCurrentUser(u); setBetHistory(authService.getBetHistory(u.username)); setIsAuthModalOpen(false); }} />}
      {isDepositModalOpen && <DepositModal onClose={() => setIsDepositModalOpen(false)} onDeposit={handleRealMoneyDeposit} />}
      {isWithdrawModalOpen && currentUser && <WithdrawModal balance={currentUser.balance} onClose={() => setIsWithdrawModalOpen(false)} onWithdraw={handleWithdrawalRequest} />}
      {isKycModalOpen && <KycModal onClose={() => setIsKycModalOpen(false)} onSubmit={handleKycSubmit} />}
      {isHistoryOpen && currentUser && <BetHistory history={betHistory} onClose={() => setIsHistoryOpen(false)} onSettle={settleBetManually} />}
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
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Available Funds</span>
                  <span className="text-emerald-400 font-black">₹{currentUser.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsDepositModalOpen(true)} className="bg-emerald-500 text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-emerald-400">Deposit</button>
                  <button onClick={initiateWithdrawal} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-700">Withdraw</button>
                </div>
                <div className="group relative">
                  <div className={`w-10 h-10 rounded-full bg-zinc-800 border flex items-center justify-center text-zinc-400 cursor-pointer ${currentUser.isAdmin ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-zinc-700'}`}>
                    {currentUser.isAdmin ? '👑' : '👤'}
                  </div>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-3 z-50">
                    <div className="px-3 py-2 border-b border-zinc-800 mb-2">
                      <p className="text-xs font-black text-white">{currentUser.username}</p>
                      <p className={`text-[8px] font-bold uppercase mt-1 ${currentUser.kycStatus === 'Verified' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        KYC: {currentUser.kycStatus}
                      </p>
                    </div>
                    {currentUser.isAdmin && (
                      <button onClick={() => setIsAdminPanelOpen(true)} className="w-full text-left px-3 py-2 text-xs text-emerald-400 font-bold hover:bg-emerald-500/10 rounded-lg">Nexus Dashboard</button>
                    )}
                    <button onClick={() => setIsHistoryOpen(true)} className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">Financial Ledger</button>
                    <button onClick={() => { authService.logout(); setCurrentUser(null); setIsAuthModalOpen(true); }} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg">End Session</button>
                  </div>
                </div>
              </>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="bg-zinc-800 text-white px-6 py-2 rounded-lg font-bold text-sm">Login / Register</button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-2 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 hidden lg:block">Market Filter</p>
          {SPORTS.map((sport) => (
            <button key={sport.id} onClick={() => setActiveSport(sport.id)} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all border ${activeSport === sport.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}>
              <div className="flex items-center gap-3"><span>{sport.icon}</span>{sport.id}</div>
            </button>
          ))}
        </aside>

        <section className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
             <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl">🛡️</div>
             <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Automatic Settlement Active</h3>
                <p className="text-zinc-500 text-xs mt-1 font-medium">Money is credited to your account the second a match finishes. No manual claims required.</p>
             </div>
             <button onClick={() => setIsDepositModalOpen(true)} className="bg-white text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200">Start Winning</button>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Market Liquidity
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map(match => (
              <MatchCard key={match.id} match={match} onSelect={handleSelection} activeSelections={selections} />
            ))}
          </div>
        </section>

        <aside className="lg:col-span-3">
          {/* Passed 'matches' prop to BetSlip for Live Odds Tracking */}
          <BetSlip 
            selections={selections} 
            onRemove={removeSelection} 
            onClear={clearSlip} 
            balance={currentUser?.balance || 0} 
            onBetPlaced={placeBet}
            matches={matches} 
          />
        </aside>
      </main>

      <footer className="bg-zinc-950 border-t border-zinc-800 p-12 mt-12">
        <div className="max-w-7xl mx-auto text-center space-y-4">
           <h4 className="text-xl font-black text-white italic tracking-tighter">NEXUS<span className="text-emerald-500">BET</span></h4>
           <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Integrated Exchange • Automatic Settlement Engine</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
