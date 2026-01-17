
import { User, BetRecord, WithdrawalRequest, HouseStats } from '../types';

const USERS_KEY = 'nexusbet_users';
const SESSION_KEY = 'nexusbet_session';
const HISTORY_KEY_PREFIX = 'nexusbet_history_';
const WITHDRAWALS_KEY = 'nexusbet_withdrawals';
const HOUSE_STATS_KEY = 'nexusbet_house_stats';

export const authService = {
  getUsers: (): User[] => {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
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

  deleteUser: (username: string) => {
    const users = authService.getUsers();
    const filtered = users.filter(u => u.username !== username);
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
    localStorage.removeItem(HISTORY_KEY_PREFIX + username);
  },

  register: (user: User): boolean => {
    const users = authService.getUsers();
    if (users.some(u => u.username === user.username)) return false;
    
    // Auto-promote 'admin' username to Admin role
    if (user.username.toLowerCase() === 'admin') {
      user.isAdmin = true;
    }

    authService.saveUser(user);
    return true;
  },

  login: (username: string, password: string, remember: boolean): User | null => {
    const users = authService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (user.isBanned) return null; // Prevent login for banned users

      if (remember) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user.username));
      } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user.username));
      }
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
      if (user?.isBanned) {
        authService.logout();
        return null;
      }
      return user || null;
    } catch (e) {
      return null;
    }
  },

  getBetHistory: (username: string): BetRecord[] => {
    const history = localStorage.getItem(HISTORY_KEY_PREFIX + username);
    return history ? JSON.parse(history) : [];
  },

  addBetToHistory: (username: string, bet: BetRecord) => {
    const history = authService.getBetHistory(username);
    history.unshift(bet);
    localStorage.setItem(HISTORY_KEY_PREFIX + username, JSON.stringify(history));
  },

  updateBetInHistory: (username: string, updatedBet: BetRecord) => {
    const history = authService.getBetHistory(username);
    const index = history.findIndex(b => b.id === updatedBet.id);
    if (index >= 0) {
      history[index] = updatedBet;
      localStorage.setItem(HISTORY_KEY_PREFIX + username, JSON.stringify(history));
    }
  },

  // House Stats & Treasury Profit
  getHouseStats: (): HouseStats => {
    const stats = localStorage.getItem(HOUSE_STATS_KEY);
    return stats ? JSON.parse(stats) : { totalTreasury: 1000000, totalVolume: 0, totalProfit: 0 };
  },

  updateHouseStats: (update: Partial<HouseStats>) => {
    const current = authService.getHouseStats();
    const updated = { ...current, ...update };
    localStorage.setItem(HOUSE_STATS_KEY, JSON.stringify(updated));
  },

  // Withdrawal Methods
  getWithdrawalRequests: (): WithdrawalRequest[] => {
    const data = localStorage.getItem(WITHDRAWALS_KEY);
    return data ? JSON.parse(data) : [];
  },

  addWithdrawalRequest: (request: WithdrawalRequest) => {
    const requests = authService.getWithdrawalRequests();
    requests.unshift(request);
    localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(requests));
  },

  updateWithdrawalStatus: (id: string, status: 'Approved' | 'Rejected') => {
    const requests = authService.getWithdrawalRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index >= 0) {
      const request = requests[index];
      request.status = status;
      
      // If rejected, refund the user
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
