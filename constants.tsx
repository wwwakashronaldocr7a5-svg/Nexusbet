
import React from 'react';
import { Match, SportType } from './types';

export const INITIAL_BALANCE = 0.00;

export const SPORTS: { id: SportType; icon: string }[] = [
  { id: 'Soccer', icon: '⚽' },
  { id: 'Basketball', icon: '🏀' },
  { id: 'Tennis', icon: '🎾' },
  { id: 'Cricket', icon: '🏏' },
  { id: 'Esports', icon: '🎮' },
  { id: 'MMA', icon: '🥊' },
];

export const TEAMS_BY_SPORT: Record<SportType, { teams: string[], leagues: string[] }> = {
  Soccer: {
    teams: ['Liverpool', 'Chelsea', 'Man United', 'Spurs', 'PSG', 'Bayern Munich', 'Dortmund', 'AC Milan', 'Inter Milan', 'Juventus', 'Atletico Madrid', 'Napoli', 'Ajax', 'Benfica', 'Porto'],
    leagues: ['Champions League', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1']
  },
  Basketball: {
    teams: ['Miami Heat', 'Boston Celtics', 'Milwaukee Bucks', 'Phoenix Suns', 'Denver Nuggets', 'Dallas Mavericks', 'Philadelphia 76ers', 'LA Clippers', 'Chicago Bulls', 'Brooklyn Nets'],
    leagues: ['NBA', 'EuroLeague']
  },
  Tennis: {
    teams: ['Novak Djokovic', 'Rafael Nadal', 'Daniil Medvedev', 'Alexander Zverev', 'Stefanos Tsitsipas', 'Holger Rune', 'Casper Ruud', 'Taylor Fritz', 'Andrey Rublev'],
    leagues: ['ATP Tour', 'Grand Slam', 'Davis Cup']
  },
  Cricket: {
    teams: ['India', 'Australia', 'England', 'South Africa', 'New Zealand', 'Pakistan', 'West Indies', 'Sri Lanka', 'Mumbai Indians', 'CSK', 'RCB', 'Gujarat Titans'],
    leagues: ['IPL', 'ICC World Cup', 'The Hundred', 'Big Bash League']
  },
  Esports: {
    teams: ['Faker', 'Chovy', 'Knight', 'Caps', 'G2 Esports', 'Fnatic', 'Team Liquid', 'FaZe Clan', 'Natus Vincere', 'Team Spirit', 'Vitality'],
    leagues: ['LEC', 'LCK', 'LPL', 'PGL Major', 'The International']
  },
  MMA: {
    teams: ['Islam Makhachev', 'Jon Jones', 'Alex Pereira', 'Conor McGregor', 'Dustin Poirier', 'Justin Gaethje', 'Max Holloway', 'Charles Oliveira'],
    leagues: ['UFC 308', 'UFC 309', 'PFL', 'Bellator']
  }
};

export const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    sport: 'Soccer',
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Manchester City',
    startTime: new Date().toISOString(),
    status: 'Live',
    minute: 64,
    score: { home: 1, away: 0 },
    odds: { home: 2.10, draw: 3.40, away: 3.10 }
  },
  {
    id: '2',
    sport: 'Soccer',
    league: 'La Liga',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    status: 'Upcoming',
    odds: { home: 1.85, draw: 3.80, away: 4.20 }
  },
  {
    id: '3',
    sport: 'Basketball',
    league: 'NBA',
    homeTeam: 'LA Lakers',
    awayTeam: 'Golden State Warriors',
    startTime: new Date().toISOString(),
    status: 'Live',
    score: { home: 102, away: 98 },
    odds: { home: 1.55, away: 2.45 }
  }
];
