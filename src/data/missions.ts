import { Mission } from '../types/game';

export const MISSIONS: Mission[] = [
  { id: 'm_1', name: 'Caçar Goblins', description: 'Elimine um grupo de goblins na floresta.', levelReq: 1, difficulty: 'Fácil', xpReward: 50, criptoBlueReward: 10, timeEstimate: '3 seg', durationSeconds: 3 },
  { id: 'm_2', name: 'Proteger a Vila', description: 'Defenda a vila de lobos selvagens.', levelReq: 3, difficulty: 'Fácil', xpReward: 100, criptoBlueReward: 25, timeEstimate: '5 seg', durationSeconds: 5 },
  { id: 'm_3', name: 'Alvo Procurado: Bandido', description: 'Capture ou elimine o líder dos bandidos.', levelReq: 5, difficulty: 'Médio', xpReward: 250, criptoBlueReward: 50, timeEstimate: '10 seg', durationSeconds: 10 },
  { id: 'm_4', name: 'Caverna dos Orcs', description: 'Limpe a caverna infestada de orcs.', levelReq: 10, difficulty: 'Médio', xpReward: 500, criptoBlueReward: 100, timeEstimate: '20 seg', durationSeconds: 20 },
  { id: 'm_5', name: 'Dragão Menor', description: 'Enfrente um dragão jovem nas montanhas.', levelReq: 20, difficulty: 'Difícil', xpReward: 1500, criptoBlueReward: 300, timeEstimate: '45 seg', durationSeconds: 45 },
  { id: 'm_6', name: 'Lorde das Sombras', description: 'Derrote a entidade sombria no abismo.', levelReq: 35, difficulty: 'Extremo', xpReward: 5000, criptoBlueReward: 1000, timeEstimate: '90 seg', durationSeconds: 90 },
];

export function getRandomMission(playerLevel: number): Mission {
  const available = MISSIONS.filter(m => m.levelReq <= playerLevel + 5);
  return available[Math.floor(Math.random() * available.length)];
}
