// Gamification Engine for LifeRPG / LevelUp Life

export interface PlayerStats {
  level: number;
  xp: number;
  nextLevelXp: number;
  gold: number;
  hp: number;
  maxHp: number;
  streak: number;
  title: string;
  avatar: string;
  completedQuests: number;
}

const STATS_KEY = 'ac_player_stats';

export const TITLES_BY_LEVEL: Record<number, string> = {
  1: 'Novato Aventurero 🛡️',
  2: 'Explorador Urbano 🗺️',
  3: 'Aprendiz de Mago 🪄',
  4: 'Guerrero de Tareas ⚔️',
  5: 'Cazador de Objetivos 🏹',
  6: 'Estratega Financiero 💰',
  7: 'Alquimista Creativo 🧪',
  8: 'Maestro del Tiempo ⏳',
  9: 'Señor de la Bóveda 🏰',
  10: 'Héroe Legendario 👑',
};

export function getTitleForLevel(level: number): string {
  const keys = Object.keys(TITLES_BY_LEVEL).map(Number).sort((a, b) => b - a);
  for (const k of keys) {
    if (level >= k) return TITLES_BY_LEVEL[k];
  }
  return 'Super Humano ✨';
}

export function getInitialStats(): PlayerStats {
  const saved = localStorage.getItem(STATS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        level: parsed.level || 1,
        xp: parsed.xp || 0,
        nextLevelXp: (parsed.level || 1) * 100,
        gold: parsed.gold || 50,
        hp: parsed.hp || 100,
        maxHp: 100,
        streak: parsed.streak || 1,
        title: getTitleForLevel(parsed.level || 1),
        avatar: parsed.avatar || '🧙‍♂️',
        completedQuests: parsed.completedQuests || 0,
      };
    } catch (e) {
      console.error(e);
    }
  }

  const initial: PlayerStats = {
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    gold: 50,
    hp: 100,
    maxHp: 100,
    streak: 1,
    title: getTitleForLevel(1),
    avatar: '🧙‍♂️',
    completedQuests: 0,
  };
  saveStats(initial);
  return initial;
}

export function saveStats(stats: PlayerStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  window.dispatchEvent(new CustomEvent('ac_player_stats_changed', { detail: stats }));
}

export function addXp(amount: number, reason: string = ''): { leveledUp: boolean; newLevel: number } {
  if (reason) console.log(`[LifeRPG] +${amount} XP: ${reason}`);
  const current = getInitialStats();
  let newXp = current.xp + amount;
  let newLevel = current.level;
  let nextLevelXp = current.nextLevelXp;
  let leveledUp = false;
  let newGold = current.gold + Math.floor(amount / 2);
  let newQuests = current.completedQuests + 1;

  while (newXp >= nextLevelXp) {
    newXp -= nextLevelXp;
    newLevel += 1;
    nextLevelXp = newLevel * 100;
    leveledUp = true;
    newGold += 100; // Bonus gold on level up
  }

  const updated: PlayerStats = {
    ...current,
    level: newLevel,
    xp: newXp,
    nextLevelXp,
    gold: newGold,
    title: getTitleForLevel(newLevel),
    completedQuests: newQuests,
  };

  saveStats(updated);

  if (leveledUp) {
    window.dispatchEvent(new CustomEvent('ac_player_level_up', { detail: { level: newLevel, title: updated.title } }));
  }

  return { leveledUp, newLevel };
}

export function addGold(amount: number): PlayerStats {
  const current = getInitialStats();
  const updated = { ...current, gold: current.gold + amount };
  saveStats(updated);
  return updated;
}
