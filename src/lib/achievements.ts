const ACHIEVEMENT_STORAGE_KEY = "arcade-hub:achievements";
const ACHIEVEMENT_PROGRESS_STORAGE_KEY = "arcade-hub:achievement-progress";

export const achievementDefinitions = {
  "cyber-snake": [
    {
      description: "Eat 1 food.",
      id: "first-bite",
      title: "First Bite",
    },
    {
      description: "Reach score 25.",
      id: "snake-apprentice",
      title: "Snake Apprentice",
    },
    {
      description: "Reach score 50.",
      id: "snake-master",
      title: "Snake Master",
    },
  ],
  "space-dodger": [
    {
      description: "Reach score 30.",
      id: "survivor",
      title: "Survivor",
    },
    {
      description: "Reach score 60.",
      id: "veteran-pilot",
      title: "Veteran Pilot",
    },
    {
      description: "Reach score 120.",
      id: "space-legend",
      title: "Space Legend",
    },
  ],
  "ai-tic-tac-toe": [
    {
      description: "Finish 1 match.",
      id: "first-match",
      title: "First Match",
    },
    {
      description: "Finish 5 matches.",
      id: "persistent-challenger",
      title: "Persistent Challenger",
    },
    {
      description: "Draw against the AI.",
      id: "draw-against-ai",
      title: "Draw Against AI",
    },
  ],
} as const;

export type AchievementGame = keyof typeof achievementDefinitions;
export type AchievementId =
  (typeof achievementDefinitions)[AchievementGame][number]["id"];

function readJsonRecord(storageKey: string) {
  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return {};
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    return parsedValue && typeof parsedValue === "object"
      ? (parsedValue as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function writeJsonRecord(storageKey: string, value: Record<string, unknown>) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Achievement persistence should never interrupt gameplay.
  }
}

export function readUnlockedAchievements(game: AchievementGame) {
  const storedAchievements = readJsonRecord(ACHIEVEMENT_STORAGE_KEY);
  const gameAchievements = storedAchievements[game];

  return Array.isArray(gameAchievements)
    ? gameAchievements.filter((id): id is string => typeof id === "string")
    : [];
}

export function unlockAchievements(
  game: AchievementGame,
  achievementIds: AchievementId[],
) {
  const storedAchievements = readJsonRecord(ACHIEVEMENT_STORAGE_KEY);
  const currentAchievements = readUnlockedAchievements(game);
  const validAchievements = new Set(
    achievementDefinitions[game].map((achievement) => achievement.id),
  );
  const nextAchievements = Array.from(
    new Set([
      ...currentAchievements,
      ...achievementIds.filter((id) => validAchievements.has(id)),
    ]),
  );

  writeJsonRecord(ACHIEVEMENT_STORAGE_KEY, {
    ...storedAchievements,
    [game]: nextAchievements,
  });

  return nextAchievements;
}

export function readAchievementProgress(game: AchievementGame, key: string) {
  const storedProgress = readJsonRecord(ACHIEVEMENT_PROGRESS_STORAGE_KEY);
  const gameProgress = storedProgress[game];

  if (!gameProgress || typeof gameProgress !== "object") {
    return 0;
  }

  const value = (gameProgress as Record<string, unknown>)[key];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function incrementAchievementProgress(
  game: AchievementGame,
  key: string,
) {
  const storedProgress = readJsonRecord(ACHIEVEMENT_PROGRESS_STORAGE_KEY);
  const gameProgress =
    storedProgress[game] && typeof storedProgress[game] === "object"
      ? (storedProgress[game] as Record<string, unknown>)
      : {};
  const nextValue = readAchievementProgress(game, key) + 1;

  writeJsonRecord(ACHIEVEMENT_PROGRESS_STORAGE_KEY, {
    ...storedProgress,
    [game]: {
      ...gameProgress,
      [key]: nextValue,
    },
  });

  return nextValue;
}
