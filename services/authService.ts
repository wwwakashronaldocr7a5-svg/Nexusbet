
import { User, BetRecord, WithdrawalRequest, HouseStats, KycStatus, Transaction, Match } from '../types';

const USERS_KEY = 'nexusbet_users';
const SESSION_KEY = 'nexusbet_session';
const HISTORY_KEY_PREFIX = 'nexusbet_history_';
const WITHDRAWALS_KEY = 'nexusbet_withdrawals';
const HOUSE_STATS_KEY = 'nexusbet_house_stats';
const GLOBAL_TRANSACTIONS_KEY = 'nexusbet_global_ledger';

export const authService = {
  getUsers: (): User[] => {
    const users = localStorage.getItem(USERS_KEY);
    let parsedUsers: User[] = users ? JSON.parse(users) : [];
    
    if (parsedUsers.length === 0) {
      const systemAdmin: User = {
        username: 'admin',
        password: 'password123',
        email: 'admin@nexusbet.com',
        balance: 1000000,
        currency: 'INR',
        isAdmin: true,
        kycStatus: 'Verified',
        notifications: {
          matchStart: true,
          goalAlerts: true,
          promos: true
        }
      };
      parsedUsers = [systemAdmin];
      localStorage.setItem(USERS_KEY, JSON.stringify(parsedUsers));
    }
    
    return parsedUsers;
  },

  saveUser: (user: User) => {
    const users = authService.getUsers();
    const existingIndex = users.findIndex(u => u.username === user.username);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  adjustUserBalance: (username: string, amount: number, reason: string) => {
    const users = authService.getUsers();
    const index = users.findIndex(u => u.username === username);
    if (index >= 0) {
      users[index].balance += amount;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      authService.logTransaction({
        id: 'ADJ-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: amount > 0 ? 'Bonus' : 'Withdrawal',
        amount: Math.abs(amount),
        status: 'Approved',
        timestamp: Date.now(),
        method: 'Admin Adjustment',
        details: `User: ${username} | Reason: ${reason}`
      });
    }
  },

  autoSettleBets: (finishedMatch: Match) => {
    if (finishedMatch.status !== 'Finished' || !finishedMatch.score) return;
    
    const result = finishedMatch.score.home > finishedMatch.score.away ? 'home' : 
                   finishedMatch.score.home < finishedMatch.score.away ? 'away' : 'draw';

    const users = authService.getUsers();
    const stats = authService.getHouseStats();

    users.forEach(user => {
      const history = authService.getBetHistory(user.username);
      let userUpdated = false;

      history.forEach(bet => {
        if (bet.status === 'Pending') {
          // Find if this bet contains the finished match
          const relevantSelection = bet.selections.find(s => s.matchId === finishedMatch.id);
          if (relevantSelection) {
            const won = relevantSelection.selection === result;
            bet.status = won ? 'Won' : 'Lost';
            bet.winnings = won ? bet.potentialPayout : 0;
            
            if (won) {
              user.balance += bet.potentialPayout;
              userUpdated = true;
              stats.totalTreasury -= bet.potentialPayout;
              stats.totalProfit -= (bet.potentialPayout - bet.stake);
              
              authService.logTransaction({
                id: 'WIN-' + bet.id,
                type: 'Bet_Winnings',
                amount: bet.potentialPayout,
                status: 'Approved',
                timestamp: Date.now(),
                details: `Auto-Settled Match: ${finishedMatch.homeTeam} vs ${finishedMatch.awayTeam}`
              });
            }
          }
        }
      });

      if (userUpdated) {
        localStorage.setItem(HISTORY_KEY_PREFIX + user.username, JSON.stringify(history));
      }
    });

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(HOUSE_STATS_KEY, JSON.stringify(stats));
  },

  // Fix: Added missing toggleUserBan to fix property not found error in AdminPanel.tsx
  toggleUserBan: (username: string) => {
    const users = authService.getUsers();
    const index = users.findIndex(u => u.username === username);
    if (index >= 0) {
      users[index].isBanned = !users[index].isBanned;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  },

  logTransaction: (tx: Transaction) => {
    const ledger = authService.getGlobalLedger();
    ledger.unshift(tx);
    localStorage.setItem(GLOBAL_TRANSACTIONS_KEY, JSON.stringify(ledger.slice(0, 500)));
  },

  getGlobalLedger: (): Transaction[] => {
    const data = localStorage.getItem(GLOBAL_TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  register: (user: User): boolean => {
    const users = authService.getUsers();
    if (users.some(u => u.username === user.username)) return false;
    user.kycStatus = 'Unverified';
    authService.saveUser(user);
    return true;
  },

  login: (username: string, password: string, remember: boolean): User | null => {
    const users = authService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user && !user.isBanned) {
      if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(user.username));
      else sessionStorage.setItem(SESSION_KEY, JSON.stringify(user.username));
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const username = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!username) return null;
    try {
      const parsedUsername = JSON.parse(username);
      const users = authService.getUsers();
      const user = users.find(u => u.username === parsedUsername);
      if (user?.isBanned) { authService.logout(); return null; }
      return user || null;
    } catch (e) { return null; }
  },

  getBetHistory: (username: string): BetRecord[] => {
    const history = localStorage.getItem(HISTORY_KEY_PREFIX + username);
    return history ? JSON.parse(history) : [];
  },

  addBetToHistory: (username: string, bet: BetRecord) => {
    const history = authService.getBetHistory(username);
    history.unshift(bet);
    localStorage.setItem(HISTORY_KEY_PREFIX + username, JSON.stringify(history));
    
    authService.logTransaction({
      id: bet.id,
      type: 'Bet_Placement',
      amount: bet.stake,
      status: 'Approved',
      timestamp: Date.now(),
      details: `User: ${username} | Stake: ${bet.stake}`
    });
  },

  updateBetInHistory: (username: string, updatedBet: BetRecord) => {
    const history = authService.getBetHistory(username);
    const index = history.findIndex(b => b.id === updatedBet.id);
    if (index >= 0) {
      history[index] = updatedBet;
      localStorage.setItem(HISTORY_KEY_PREFIX + username, JSON.stringify(history));
    }
  },

  getHouseStats: (): HouseStats => {
    const stats = localStorage.getItem(HOUSE_STATS_KEY);
    return stats ? JSON.parse(stats) : { totalTreasury: 1000000, totalVolume: 0, totalProfit: 0 };
  },

  updateHouseStats: (update: Partial<HouseStats>) => {
    const current = authService.getHouseStats();
    const updated = { ...current, ...update };
    localStorage.setItem(HOUSE_STATS_KEY, JSON.stringify(updated));
  },

  getWithdrawalRequests: (): WithdrawalRequest[] => {
    const data = localStorage.getItem(WITHDRAWALS_KEY);
    return data ? JSON.parse(data) : [];
  },

  addWithdrawalRequest: (request: WithdrawalRequest) => {
    const requests = authService.getWithdrawalRequests();
    requests.unshift(request);
    localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(requests));
    
    authService.logTransaction({
      id: request.id,
      type: 'Withdrawal',
      amount: request.amount,
      status: 'Pending',
      timestamp: request.timestamp,
      method: 'UPI',
      details: `User: ${request.username}`
    });
  },

  updateWithdrawalStatus: (id: string, status: 'Approved' | 'Rejected') => {
    const requests = authService.getWithdrawalRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index >= 0) {
      const request = requests[index];
      request.status = status;
      
      const ledger = authService.getGlobalLedger();
      const txIndex = ledger.findIndex(t => t.id === id);
      if (txIndex >= 0) {
        ledger[txIndex].status = status;
        localStorage.setItem(GLOBAL_TRANSACTIONS_KEY, JSON.stringify(ledger));
      }

      if (status === 'Rejected') {
        const users = authService.getUsers();
        const userIndex = users.findIndex(u => u.username === request.username);
        if (userIndex >= 0) {
          users[userIndex].balance += request.amount;
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
      }
      localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(requests));
    }
  }
};
