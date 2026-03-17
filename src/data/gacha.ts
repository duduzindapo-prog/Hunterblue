import { CLASSES } from './classes';
import { Rarity } from '../types/game';

export const GACHA_COST = 100;

const RARITY_RATES: Record<Rarity, number> = {
  'Comum': 50,
  'Raro': 30,
  'Épico': 15,
  'Lendário': 4.5,
  'Mítico': 0.5
};

export function pullGacha(): string {
  const rand = Math.random() * 100;
  let cumulative = 0;
  let pulledRarity: Rarity = 'Comum';

  for (const [rarity, rate] of Object.entries(RARITY_RATES)) {
    cumulative += rate;
    if (rand <= cumulative) {
      pulledRarity = rarity as Rarity;
      break;
    }
  }

  const possibleClasses = CLASSES.filter(c => c.rarity === pulledRarity);
  if (possibleClasses.length === 0) return CLASSES[0].id; // Fallback

  const pulledClass = possibleClasses[Math.floor(Math.random() * possibleClasses.length)];
  return pulledClass.id;
}
