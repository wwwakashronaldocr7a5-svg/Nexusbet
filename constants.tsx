
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

export const POPULAR_LEAGUES: Record<SportType, { id: string; name: string; icon: string }[]> = {
  Soccer: [
    { id: 'Premier League', name: 'EPL', icon: '🇬🇧' },
    { id: 'La Liga', name: 'LaLiga', icon: '🇪🇸' },
    { id: 'Serie A', name: 'Serie A', icon: '🇮🇹' },
    { id: 'Bundesliga', name: 'Bundesliga', icon: '🇩🇪' },
    { id: 'Ligue 1', name: 'Ligue 1', icon: '🇫🇷' },
    { id: 'Champions League', name: 'UCL', icon: '🏆' },
  ],
  Cricket: [
    { id: 'IPL', name: 'IPL', icon: '🇮🇳' },
    { id: 'T20 World Cup', name: 'T20 WC', icon: '🏏' },
    { id: 'Big Bash League', name: 'BBL', icon: '🇦🇺' },
  ],
  Basketball: [], Tennis: [], Esports: [], MMA: []
};

export const TEAMS_BY_SPORT: Record<SportType, { teams: string[], leagues: string[] }> = {
  Soccer: {
    teams: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'Bayern Munich', 'Dortmund', 'Bayer Leverkusen', 'PSG', 'Marseille', 'Liverpool', 'Man City', 'Arsenal'],
    leagues: ['La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Premier League']
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
    teams: ['Faker', 'Chovy', 'Knight', 'Caps', 'G2 Esports', 'Fnatic', 'Team Liquid', 'FaZe Clan', 'Natus Pione', 'Team Spirit', 'Vitality'],
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
    id: 's-2',
    sport: 'Soccer',
    league: 'La Liga',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    startTime: new Date(Date.now() + 7200000).toISOString(),
    status: 'Upcoming',
    odds: { home: 1.85, draw: 3.80, away: 4.20 }
  },
  {
    id: 's-3',
    sport: 'Soccer',
    league: 'Serie A',
    homeTeam: 'Juventus',
    awayTeam: 'AC Milan',
    startTime: new Date(Date.now() + 14400000).toISOString(),
    status: 'Upcoming',
    odds: { home: 2.30, draw: 3.10, away: 3.20 }
  }
];
