import {
  achievementDefinitions,
  readUnlockedAchievements,
  type AchievementGame,
} from "@/lib/achievements";
import { games, type Game } from "@/lib/games";

const BEST_SCORE_KEYS = {
  "2048": "arcade-hub:2048:best-score",
  "cyber-snake": "arcade-hub:cyber-snake:best-score",
  "space-dodger": "arcade-hub:space-dodger:best-score",
} as const;
const GAME_PLAY_COUNTS_STORAGE_KEY = "arcade-hub:game-play-counts";
const TIC_TAC_TOE_RECORD_STORAGE_KEY = "arcade-hub:ai-tic-tac-toe:record";

type GameSlug = Game["slug"];

type TicTacToeRecord = {
  draws: number;
  losses: number;
  wins: number;
};

export type GlobalStats = {
  puzzleBestScore: number;
  favoriteGame: string;
  gamePlayCounts: Record<GameSlug, number>;
  overallProgressPercentage: number;
  snakeBestScore: number;
  spaceDodgerBestScore: number;
  ticTacToeRecord: TicTacToeRecord;
  totalAchievementsUnlocked: number;
  totalAvailableAchievements: number;
  totalGamesPlayed: number;
};

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
    // Stats persistence should never interrupt gameplay.
  }
}

function readStoredNumber(storageKey: string) {
  try {
    const storedValue = window.localStorage.getItem(storageKey);
    const parsedValue = storedValue ? Number.parseInt(storedValue, 10) : 0;

    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
  } catch {
    return 0;
  }
}

function readRecordNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

function readGamePlayCounts(): Record<GameSlug, number> {
  const storedCounts = readJsonRecord(GAME_PLAY_COUNTS_STORAGE_KEY);

  return games.reduce(
    (counts, game) => ({
      ...counts,
      [game.slug]: readRecordNumber(storedCounts, game.slug),
    }),
    {} as Record<GameSlug, number>,
  );
}

function readTicTacToeRecord(): TicTacToeRecord {
  const storedRecord = readJsonRecord(TIC_TAC_TOE_RECORD_STORAGE_KEY);

  return {
    draws: readRecordNumber(storedRecord, "draws"),
    losses: readRecordNumber(storedRecord, "losses"),
    wins: readRecordNumber(storedRecord, "wins"),
  };
}

export function recordGameStarted(game: GameSlug) {
  const storedCounts = readJsonRecord(GAME_PLAY_COUNTS_STORAGE_KEY);

  writeJsonRecord(GAME_PLAY_COUNTS_STORAGE_KEY, {
    ...storedCounts,
    [game]: readRecordNumber(storedCounts, game) + 1,
  });
}

export function recordTicTacToeResult(winner: "X" | "O" | "draw") {
  const storedRecord = readJsonRecord(TIC_TAC_TOE_RECORD_STORAGE_KEY);
  const resultKey =
    winner === "X" ? "wins" : winner === "O" ? "losses" : "draws";

  recordGameStarted("ai-tic-tac-toe");
  writeJsonRecord(TIC_TAC_TOE_RECORD_STORAGE_KEY, {
    ...storedRecord,
    [resultKey]: readRecordNumber(storedRecord, resultKey) + 1,
  });
}

export function readGlobalStats(): GlobalStats {
  const gamePlayCounts = readGamePlayCounts();
  const totalAchievementsUnlocked = games.reduce(
    (total, game) =>
      total + readUnlockedAchievements(game.slug as AchievementGame).length,
    0,
  );
  const totalAvailableAchievements = Object.values(
    achievementDefinitions,
  ).reduce((total, achievements) => total + achievements.length, 0);
  const favoriteGame =
    games
      .map((game) => ({
        count: gamePlayCounts[game.slug],
        title: game.title,
      }))
      .sort((a, b) => b.count - a.count)[0] ?? null;

  return {
    favoriteGame:
      favoriteGame && favoriteGame.count > 0 ? favoriteGame.title : "No plays yet",
    gamePlayCounts,
    overallProgressPercentage:
      totalAvailableAchievements > 0
        ? Math.round(
            (totalAchievementsUnlocked / totalAvailableAchievements) * 100,
          )
        : 0,
    puzzleBestScore: readStoredNumber(BEST_SCORE_KEYS["2048"]),
    snakeBestScore: readStoredNumber(BEST_SCORE_KEYS["cyber-snake"]),
    spaceDodgerBestScore: readStoredNumber(BEST_SCORE_KEYS["space-dodger"]),
    ticTacToeRecord: readTicTacToeRecord(),
    totalAchievementsUnlocked,
    totalAvailableAchievements,
    totalGamesPlayed: Object.values(gamePlayCounts).reduce(
      (total, count) => total + count,
      0,
    ),
  };
}
