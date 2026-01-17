
import React, { useState, useMemo, useEffect } from 'react';
import { Match, SportType, BetSelection, User, AIInsight, BetRecord, WithdrawalRequest, HouseStats } from './types';
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

const App: React.FC = () => {
  const [activeSport, setActiveSport] = useState<SportType>('Soccer');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Live' | 'Upcoming'>('All');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // Autonomous Fixture Pipeline & Real-time Match Simulation Engine
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      setMatches(currentMatches => {
        // 1. Process Discovery (New Matches)
        let updatedMatches = [...currentMatches];
        
        // Randomly discover a new match (approx 15% chance every tick)
        if (Math.random() < 0.15) {
          const randomSport = SPORTS[Math.floor(Math.random() * SPORTS.length)].id;
          const { teams, leagues } = TEAMS_BY_SPORT[randomSport];
          
          let home = teams[Math.floor(Math.random() * teams.length)];
          let away = teams[Math.floor(Math.random() * teams.length)];
          while (home === away) {
             away = teams[Math.floor(Math.random() * teams.length)];
          }

          const newMatch: Match = {
            id: Math.random().toString(36).substr(2, 9),
            sport: randomSport,
            league: leagues[Math.floor(Math.random() * leagues.length)],
            homeTeam: home,
            awayTeam: away,
            startTime: new Date(Date.now() + (Math.random() * 172800000)).toISOString(),
            status: 'Upcoming',
            odds: {
              home: 1.5 + Math.random() * 2,
              draw: randomSport === 'Soccer' ? 2.5 + Math.random() * 2 : undefined,
              away: 1.5 + Math.random() * 2
            },
            isNew: true
          };
          updatedMatches.unshift(newMatch);

          // Remove "New" tag after 30 seconds
          setTimeout(() => {
            setMatches(prev => prev.map(m => m.id === newMatch.id ? { ...m, isNew: false } : m));
          }, 30000);
        }

        // 2. Process Live Simulations
        return updatedMatches.map(match => {
          if (match.status !== 'Live') return match;

          const newMinute = (match.minute || 0) + 1;
          let newScore = match.score ? { ...match.score } : undefined;
          if (Math.random() < 0.03 && newScore) {
            if (Math.random() > 0.5) newScore.home += 1;
            else newScore.away += 1;
          }

          const fluctuate = (odd: number) => Math.max(1.01, odd + ((Math.random() - 0.5) * 0.1));
          const newOdds = {
            home: fluctuate(match.odds.home),
            draw: match.odds.draw ? fluctuate(match.odds.draw) : undefined,
            away: fluctuate(match.odds.away),
          };

          let newStatus: Match['status'] = match.status;
          if (newMinute >= 95) newStatus = 'Finished';

          return { ...match, minute: newMinute, score: newScore, odds: newOdds, status: newStatus };
        });
      });
    }, 5000);

    return () => clearInterval(simulationInterval);
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const sportMatch = m.sport === activeSport;
      const statusMatch = statusFilter === 'All' || m.status === statusFilter;
      return sportMatch && statusMatch;
    });
  }, [activeSport, statusFilter, matches]);

  const handleSelection = (selection: BetSelection) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelections(prev => {
      const filtered = prev.filter(s => s.matchId !== selection.matchId);
      const isAlreadyInSlip = prev.find(s => s.matchId === selection.matchId && s.selection === selection.selection);
      if (isAlreadyInSlip) return filtered;
      return [...filtered, selection];
    });
  };

  const removeSelection = (matchId: string) => {
    setSelections(prev => prev.filter(s => s.matchId !== matchId));
  };

  const clearSlip = () => setSelections([]);

  const placeBet = (stake: number) => {
    if (!currentUser) return;
    
    const totalOdds = selections.reduce((acc, curr) => acc * curr.odds, 1);
    const newBet: BetRecord = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      selections: [...selections],
      stake,
      totalOdds,
      potentialPayout: stake * totalOdds,
      status: 'Pending'
    };

    const newBalance = currentUser.balance - stake;
    const updatedUser = { ...currentUser, balance: newBalance };
    
    setCurrentUser(updatedUser);
    authService.saveUser(updatedUser);
    authService.addBetToHistory(currentUser.username, newBet);
    
    const houseStats = authService.getHouseStats();
    authService.updateHouseStats({
      totalTreasury: houseStats.totalTreasury + stake,
      totalVolume: houseStats.totalVolume + stake,
      totalProfit: houseStats.totalProfit + stake
    });

    setBetHistory(prev => [newBet, ...prev]);
    setSelections([]);
  };

  const handleDeposit = (amount: number) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, balance: currentUser.balance + amount };
    setCurrentUser(updatedUser);
    authService.saveUser(updatedUser);
  };

  const handleWithdrawalRequest = (amount: number, upiId: string) => {
    if (!currentUser) return;
    
    const request: WithdrawalRequest = {
      id: Math.random().toString(36).substr(2, 9),
      username: currentUser.username,
      amount,
      upiId,
      timestamp: Date.now(),
      status: 'Pending'
    };

    const newBalance = currentUser.balance - amount;
    const updatedUser = { ...currentUser, balance: newBalance };
    
    setCurrentUser(updatedUser);
    authService.saveUser(updatedUser);
    authService.addWithdrawalRequest(request);
  };

  const settleBet = (bet: BetRecord) => {
    if (!currentUser) return;
    
    const won = Math.random() > 0.6;
    const updatedBet: BetRecord = {
      ...bet,
      status: won ? 'Won' : 'Lost',
      winnings: won ? bet.potentialPayout : 0
    };

    if (won) {
      const newBalance = currentUser.balance + bet.potentialPayout;
      const updatedUser = { ...currentUser, balance: newBalance };
      setCurrentUser(updatedUser);
      authService.saveUser(updatedUser);

      const houseStats = authService.getHouseStats();
      authService.updateHouseStats({
        totalTreasury: houseStats.totalTreasury - bet.potentialPayout,
        totalProfit: houseStats.totalProfit - bet.potentialPayout
      });
    }

    authService.updateBetInHistory(currentUser.username, updatedBet);
    setBetHistory(prev => prev.map(b => b.id === updatedBet.id ? updatedBet : b));
  };

  const fetchAIInsight = async (match: Match) => {
    setLoadingInsight(true);
    setSelectedInsight(null);
    const insight = await getMatchInsight(match);
    setSelectedInsight(insight);
    setLoadingInsight(false);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setBetHistory([]);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setBetHistory(authService.getBetHistory(user.username));
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isAuthModalOpen && <AuthModal onSuccess={handleAuthSuccess} />}
      {isDepositModalOpen && (
        <DepositModal 
          onClose={() => setIsDepositModalOpen(false)} 
          onDeposit={handleDeposit} 
        />
      )}
      {isWithdrawModalOpen && currentUser && (
        <WithdrawModal
          balance={currentUser.balance}
          onClose={() => setIsWithdrawModalOpen(false)}
          onWithdraw={handleWithdrawalRequest}
        />
      )}
      {isHistoryOpen && currentUser && (
        <BetHistory 
          history={betHistory} 
          onClose={() => setIsHistoryOpen(false)} 
          onSettle={settleBet}
        />
      )}
      {isAdminPanelOpen && currentUser?.isAdmin && (
        <AdminPanel 
          onClose={() => setIsAdminPanelOpen(false)} 
          currentUser={currentUser}
          onRefreshUser={refreshUser}
        />
      )}
      {isSettingsOpen && currentUser && (
        <SettingsModal 
          user={currentUser} 
          onClose={() => setIsSettingsOpen(false)} 
          onUpdate={refreshUser}
        />
      )}

      {/* Navbar */}
      <nav className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black text-white italic tracking-tighter cursor-pointer" onClick={() => window.location.reload()}>
              NEXUS<span className="text-emerald-500">BET</span>
            </h1>
            <div className="hidden md:flex gap-6">
              <button className="text-sm font-bold text-white hover:text-emerald-500 transition-colors uppercase">Sports</button>
              <button 
                onClick={() => currentUser && setIsHistoryOpen(true)}
                className="text-sm font-bold text-zinc-500 hover:text-white transition-colors uppercase"
              >
                My Bets
              </button>
              <button className="text-sm font-bold text-zinc-500 hover:text-white transition-colors uppercase">Casino</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Balance</span>
                  <span className="text-emerald-400 font-black">₹{currentUser.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsDepositModalOpen(true)}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-400 transition-colors"
                  >
                    Deposit
                  </button>
                  <button 
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-zinc-700 transition-colors border border-zinc-700"
                  >
                    Withdraw
                  </button>
                </div>
                <div className="group relative">
                  <div className={`w-10 h-10 rounded-full bg-zinc-800 border flex items-center justify-center text-zinc-400 cursor-pointer transition-all ${currentUser.isAdmin ? 'border-emerald-500' : 'border-zinc-700 hover:border-emerald-500'}`}>
                    {currentUser.isAdmin ? '⭐' : '👤'}
                  </div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50">
                    <p className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase border-b border-zinc-800 mb-2 flex justify-between items-center">
                      {currentUser.username}
                      {currentUser.isAdmin && <span className="text-[8px] bg-emerald-500 text-black px-1 rounded">ADMIN</span>}
                    </p>
                    {currentUser.isAdmin && (
                      <button 
                        onClick={() => setIsAdminPanelOpen(true)}
                        className="w-full text-left px-4 py-2 text-sm text-emerald-400 font-bold hover:bg-emerald-500/10 rounded-lg transition-colors"
                      >
                        Admin Panel
                      </button>
                    )}
                    <button 
                      onClick={() => setIsHistoryOpen(true)}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      Bet History
                    </button>
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      Settings
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-zinc-800 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-zinc-700 transition-colors"
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - Sports Categories */}
        <aside className="lg:col-span-2 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
          <p className="text-xs font-bold text-zinc-500 uppercase mb-2 hidden lg:block">Popular Sports</p>
          {SPORTS.map((sport) => {
            const count = matches.filter(m => m.sport === sport.id && m.status !== 'Finished').length;
            return (
              <button
                key={sport.id}
                onClick={() => setActiveSport(sport.id)}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap lg:whitespace-normal border ${
                  activeSport === sport.id 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{sport.icon}</span>
                  {sport.id}
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${activeSport === sport.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Center - Matches */}
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-2xl">
             <div className="relative z-10">
                <span className="bg-white/20 text-[10px] font-black uppercase px-2 py-0.5 rounded mb-2 inline-block">Flash Promo</span>
                <h2 className="text-3xl font-black mb-2 uppercase italic tracking-tighter">Champions League Night</h2>
                <p className="text-emerald-100 text-sm font-medium mb-4">Get 50% extra profit on multi-bets with 5+ selections!</p>
                <button 
                  onClick={() => setIsDepositModalOpen(true)}
                  className="bg-white text-emerald-950 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-emerald-50 transition-colors"
                >
                  Bet Now
                </button>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {activeSport} Matches
              <span className="text-xs font-medium text-zinc-500">({filteredMatches.length})</span>
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setStatusFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  statusFilter === 'All' 
                    ? 'bg-zinc-800 text-white border-zinc-700' 
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setStatusFilter('Live')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  statusFilter === 'Live' 
                    ? 'bg-zinc-800 text-white border-zinc-700' 
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                Live
              </button>
              <button 
                onClick={() => setStatusFilter('Upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  statusFilter === 'Upcoming' 
                    ? 'bg-zinc-800 text-white border-zinc-700' 
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                Upcoming
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map(match => (
              <div key={match.id} className="group relative">
                <MatchCard 
                  match={match} 
                  onSelect={handleSelection} 
                  activeSelections={selections}
                />
                <button 
                  onClick={() => fetchAIInsight(match)}
                  className="absolute bottom-4 right-4 text-[10px] font-bold text-emerald-500 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✨ AI Analysis
                </button>
              </div>
            ))}
            {filteredMatches.length === 0 && (
              <div className="col-span-full py-20 text-center bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Waiting for discovered markets...</p>
                <div className="flex justify-center gap-1 mt-4">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>

          {(loadingInsight || selectedInsight) && (
            <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
               <div className="flex justify-between items-start mb-4">
                  <h4 className="text-emerald-400 font-bold flex items-center gap-2">
                    <span className="text-xl">🤖</span> NexusAI Insights
                  </h4>
                  {selectedInsight && (
                    <button onClick={() => setSelectedInsight(null)} className="text-zinc-500 hover:text-white text-xs">✕</button>
                  )}
               </div>
               {loadingInsight ? (
                 <div className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-400 animate-pulse text-sm">NexusAI is analyzing historical data and player performance...</p>
                 </div>
               ) : selectedInsight && (
                 <div className="space-y-3">
                    <div className="flex items-center gap-4">
                       <div className="bg-zinc-800 px-3 py-1 rounded-full text-xs font-bold text-emerald-500 border border-emerald-500/20">
                          {selectedInsight.confidence}% Confidence
                       </div>
                       <p className="text-white font-bold text-lg">{selectedInsight.prediction}</p>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed">{selectedInsight.reasoning}</p>
                 </div>
               )}
            </div>
          )}
        </section>

        <aside className="lg:col-span-3">
          <BetSlip 
            selections={selections} 
            onRemove={removeSelection}
            onClear={clearSlip}
            balance={currentUser?.balance || 0}
            onBetPlaced={placeBet}
          />
          
          <div className="mt-8 bg-zinc-900/40 rounded-xl p-4 border border-zinc-800/60">
            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">Recent Winners</h4>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">🏆</div>
                  <div>
                    <p className="text-xs font-bold text-white">user_823{i} won ₹42,000.00</p>
                    <p className="text-[10px] text-zinc-500 font-medium">8-leg Soccer Acca</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <footer className="bg-zinc-950 border-t border-zinc-800 p-8 mt-12 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Gambling can be addictive. Please play responsibly.</p>
          <div className="flex justify-center gap-6">
            <span className="text-2xl opacity-20 grayscale">🔞</span>
            <span className="text-2xl opacity-20 grayscale">🛡️</span>
            <span className="text-2xl opacity-20 grayscale">🔐</span>
          </div>
          <p className="text-xs text-zinc-600">© 2024 NexusBet Group. All rights reserved. Licenses: MGA/B2C/123/2024</p>
        </div>
      </footer>
    </div>
  );
};

export default App;