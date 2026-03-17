export type Rarity = 'Comum' | 'Raro' | 'Épico' | 'Lendário' | 'Mítico';

export interface HunterClass {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  skills: Skill[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  damageMultiplier: number;
  cooldown: number;
  level: number;
}

export interface UserStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  level: number;
  xp: number;
  criptoBlue: number;
  currentClassId: string;
  unlockedClasses: string[];
  stats: UserStats;
  inventory: string[];
  pvpWins: number;
  pvpLosses: number;
  missionsCompleted: number;
  isOnline: boolean;
  lastLogin: string;
  lastDaily: string;
  dailyStreak: number;
  activeMission?: {
    missionId: string;
    startTime: string;
    endTime: string;
  } | null;
}

export interface Message {
  id?: string;
  text: string;
  authorUid: string;
  authorName: string;
  type: 'user' | 'system' | 'combat' | 'gacha';
  timestamp: string;
}

export interface PvPBattle {
  id?: string;
  challengerUid: string;
  challengerName: string;
  defenderUid: string;
  defenderName: string;
  status: 'pending' | 'accepted' | 'declined' | 'finished';
  winnerUid: string;
  log: string[];
  createdAt: string;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  levelReq: number;
  difficulty: 'Fácil' | 'Médio' | 'Difícil' | 'Extremo';
  xpReward: number;
  criptoBlueReward: number;
  timeEstimate: string;
  durationSeconds: number;
}
