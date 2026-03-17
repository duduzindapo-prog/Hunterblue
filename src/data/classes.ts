import { HunterClass } from '../types/game';

export const CLASSES: HunterClass[] = [
  {
    id: 'c_iniciante',
    name: 'Caçador Iniciante',
    rarity: 'Comum',
    description: 'Um caçador recém-formado, pronto para aprender.',
    baseStats: { hp: 100, attack: 10, defense: 10, speed: 10 },
    skills: [
      { id: 's_golpe_basico', name: 'Golpe Básico', description: 'Um ataque simples.', damageMultiplier: 1.2, cooldown: 0, level: 1 }
    ]
  },
  {
    id: 'c_espadachim',
    name: 'Caçador Espadachim',
    rarity: 'Raro',
    description: 'Mestre no uso de lâminas afiadas.',
    baseStats: { hp: 120, attack: 25, defense: 15, speed: 15 },
    skills: [
      { id: 's_corte_rapido', name: 'Corte Rápido', description: 'Um corte veloz.', damageMultiplier: 1.5, cooldown: 1, level: 1 },
      { id: 's_lamina_giratoria', name: 'Lâmina Giratória', description: 'Ataque em área.', damageMultiplier: 2.0, cooldown: 3, level: 1 }
    ]
  },
  {
    id: 'c_atirador',
    name: 'Caçador Atirador',
    rarity: 'Raro',
    description: 'Especialista em combate à distância.',
    baseStats: { hp: 90, attack: 30, defense: 10, speed: 20 },
    skills: [
      { id: 's_tiro_preciso', name: 'Tiro Preciso', description: 'Um tiro certeiro.', damageMultiplier: 1.8, cooldown: 1, level: 1 },
      { id: 's_chuva_balas', name: 'Chuva de Balas', description: 'Dispara múltiplas vezes.', damageMultiplier: 2.5, cooldown: 4, level: 1 }
    ]
  },
  {
    id: 'c_sombrio',
    name: 'Caçador Sombrio',
    rarity: 'Épico',
    description: 'Move-se nas sombras para abater seus alvos.',
    baseStats: { hp: 110, attack: 40, defense: 12, speed: 30 },
    skills: [
      { id: 's_passo_sombrio', name: 'Passo Sombrio', description: 'Ataque furtivo.', damageMultiplier: 2.5, cooldown: 2, level: 1 },
      { id: 's_execucao', name: 'Execução', description: 'Dano massivo se o alvo estiver fraco.', damageMultiplier: 4.0, cooldown: 5, level: 1 }
    ]
  },
  {
    id: 'c_bestial',
    name: 'Caçador Bestial',
    rarity: 'Épico',
    description: 'Usa a força bruta e instintos animais.',
    baseStats: { hp: 200, attack: 35, defense: 25, speed: 15 },
    skills: [
      { id: 's_instinto_bestial', name: 'Instinto Bestial', description: 'Ataque selvagem.', damageMultiplier: 2.0, cooldown: 1, level: 1 },
      { id: 's_rugido', name: 'Rugido', description: 'Aumenta o próprio ataque.', damageMultiplier: 0, cooldown: 4, level: 1 }
    ]
  },
  {
    id: 'c_arcano',
    name: 'Caçador Arcano',
    rarity: 'Lendário',
    description: 'Manipula magia pura para destruir inimigos.',
    baseStats: { hp: 100, attack: 60, defense: 15, speed: 25 },
    skills: [
      { id: 's_esfera_magica', name: 'Esfera Mágica', description: 'Lança energia pura.', damageMultiplier: 2.5, cooldown: 1, level: 1 },
      { id: 's_chuva_arcana', name: 'Chuva Arcana', description: 'Devasta o campo de batalha.', damageMultiplier: 5.0, cooldown: 6, level: 1 }
    ]
  },
  {
    id: 'c_blue',
    name: 'Caçador Blue',
    rarity: 'Mítico',
    description: 'A lenda viva. O caçador supremo de Hunter Blue.',
    baseStats: { hp: 300, attack: 100, defense: 50, speed: 50 },
    skills: [
      { id: 's_corte_blue', name: 'Corte Blue', description: 'Ataque imbuído com energia Blue.', damageMultiplier: 4.0, cooldown: 1, level: 1 },
      { id: 's_explosao_suprema', name: 'Explosão Suprema', description: 'Apaga o inimigo da existência.', damageMultiplier: 10.0, cooldown: 8, level: 1 }
    ]
  }
];

export const getClassById = (id: string) => CLASSES.find(c => c.id === id) || CLASSES[0];
