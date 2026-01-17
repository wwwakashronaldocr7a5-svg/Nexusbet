
export type SportType = 'Soccer' | 'Basketball' | 'Tennis' | 'Cricket' | 'Esports' | 'MMA';
export type BetStatus = 'Pending' | 'Won' | 'Lost';
export type TransactionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Processing';
export type TransactionType = 'Deposit' | 'Withdrawal' | 'Bet_Placement' | 'Bet_Winnings' | 'Bonus';
export type KycStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';

export interface Odds {
  home: number;
  draw?: number;
  away: number;
}

export interface Match {
  id: string;
  sport: SportType;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'Live' | 'Upcoming' | 'Finished';
  score?: { home: number; away: number };
  odds: Odds;
  minute?: number;
  isNew?: boolean;
}

export interface BetSelection {
  matchId: string;
  matchName: string;
  selection: 'home' | 'draw' | 'away';
  odds: number;
  teamName: string;
}

export interface BetRecord {
  id: string;
  timestamp: number;
  selections: BetSelection[];
  stake: number;
  totalOdds: number;
  potentialPayout: number;
  status: BetStatus;
  winnings?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  timestamp: number;
  method?: string;
  details?: string;
}

export interface WithdrawalRequest {
  id: string;
  username: string;
  amount: number;
  upiId: string;
  timestamp: number;
  status: TransactionStatus;
}

export interface HouseStats {
  totalTreasury: number;
  totalVolume: number;
  totalProfit: number;
}

export interface AIInsight {
  matchId: string;
  prediction: string;
  confidence: number;
  reasoning: string;
}

export interface User {
  username: string;
  password?: string;
  balance: number;
  bonusBalance?: number;
  currency: string;
  email: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  kycStatus: KycStatus;
  kycDetails?: {
    fullName: string;
    idNumber: string;
    idType: string;
  };
  notifications?: {
    matchStart: boolean;
    goalAlerts: boolean;
    promos: boolean;
  };
}

export interface UserState {
  balance: number;
  currency: string;
}
