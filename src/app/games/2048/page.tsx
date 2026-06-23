"use client";

import Link from "next/link";
import { type TouchEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  achievementDefinitions,
  readUnlockedAchievements,
  unlockAchievements,
  type AchievementId,
} from "@/lib/achievements";
import { getGame } from "@/lib/games";
import {
  playSound,
  readSoundPreference,
  saveSoundPreference,
  unlockAudio,
} from "@/lib/sound";
import { recordGameStarted } from "@/lib/stats";

const GRID_SIZE = 4;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;
const SWIPE_THRESHOLD_PX = 32;
const BEST_SCORE_STORAGE_KEY = "arcade-hub:2048:best-score";

type Direction = "up" | "down" | "left" | "right";

type Point = {
  x: number;
  y: number;
};

type GameState = {
  board: number[];
  gameOver: boolean;
  maxTile: number;
  score: number;
};

type MoveResult = {
  board: number[];
  changed: boolean;
  didMerge: boolean;
  gainedScore: number;
  maxTile: number;
};

const emptyBoard = Array<number>(CELL_COUNT).fill(0);

const tileStyles: Record<number, string> = {
  2: "border-cyan-200/25 bg-cyan-200/20 text-cyan-50 shadow-[0_0_20px_rgba(103,232,249,0.16)]",
  4: "border-sky-200/25 bg-sky-200/20 text-sky-50 shadow-[0_0_20px_rgba(125,211,252,0.16)]",
  8: "border-emerald-200/30 bg-emerald-300/25 text-emerald-50 shadow-[0_0_22px_rgba(110,231,183,0.2)]",
  16: "border-lime-200/35 bg-lime-300/30 text-lime-50 shadow-[0_0_24px_rgba(190,242,100,0.22)]",
  32: "border-amber-200/35 bg-amber-300/30 text-amber-50 shadow-[0_0_24px_rgba(252,211,77,0.24)]",
  64: "border-orange-200/35 bg-orange-400/35 text-orange-50 shadow-[0_0_26px_rgba(251,146,60,0.26)]",
  128: "border-pink-200/35 bg-pink-400/35 text-pink-50 shadow-[0_0_28px_rgba(244,114,182,0.3)]",
  256: "border-fuchsia-200/40 bg-fuchsia-400/40 text-fuchsia-50 shadow-[0_0_30px_rgba(217,70,239,0.32)]",
  512: "border-violet-200/45 bg-violet-400/45 text-violet-50 shadow-[0_0_34px_rgba(167,139,250,0.36)]",
  1024: "border-cyan-100/50 bg-cyan-300/50 text-white shadow-[0_0_38px_rgba(34,211,238,0.4)]",
  2048: "border-white/70 bg-white/80 text-zinc-950 shadow-[0_0_48px_rgba(255,255,255,0.45)]",
};

function addRandomTile(board: number[]) {
  const openCells = board
    .map((value, index) => (value === 0 ? index : null))
    .filter((index): index is number => index !== null);

  if (openCells.length === 0) {
    return board;
  }

  const nextBoard = [...board];
  const index = openCells[Math.floor(Math.random() * openCells.length)];
  nextBoard[index] = Math.random() < 0.9 ? 2 : 4;

  return nextBoard;
}

function createInitialState(): GameState {
  const board = addRandomTile(addRandomTile(emptyBoard));

  return {
    board,
    gameOver: false,
    maxTile: Math.max(...board),
    score: 0,
  };
}

function readBestScore() {
  try {
    const storedScore = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
    const parsedScore = storedScore ? Number.parseInt(storedScore, 10) : 0;

    return Number.isFinite(parsedScore) && parsedScore > 0 ? parsedScore : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number) {
  try {
    window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(score));
  } catch {
    // Best-score persistence should never interrupt gameplay.
  }
}

function mergeLine(line: number[]) {
  const values = line.filter((value) => value !== 0);
  const mergedValues: number[] = [];
  let didMerge = false;
  let gainedScore = 0;

  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === values[index + 1]) {
      const mergedValue = values[index] * 2;
      mergedValues.push(mergedValue);
      gainedScore += mergedValue;
      didMerge = true;
      index += 1;
    } else {
      mergedValues.push(values[index]);
    }
  }

  while (mergedValues.length < GRID_SIZE) {
    mergedValues.push(0);
  }

  return {
    didMerge,
    gainedScore,
    line: mergedValues,
    maxTile: Math.max(...mergedValues),
  };
}

function getLineIndexes(direction: Direction, line: number) {
  return Array.from({ length: GRID_SIZE }, (_, index) => {
    if (direction === "left") {
      return line * GRID_SIZE + index;
    }

    if (direction === "right") {
      return line * GRID_SIZE + (GRID_SIZE - 1 - index);
    }

    if (direction === "up") {
      return index * GRID_SIZE + line;
    }

    return (GRID_SIZE - 1 - index) * GRID_SIZE + line;
  });
}

function moveBoard(board: number[], direction: Direction): MoveResult {
  const nextBoard = [...board];
  let didMerge = false;
  let gainedScore = 0;
  let maxTile = Math.max(...board);

  for (let line = 0; line < GRID_SIZE; line += 1) {
    const indexes = getLineIndexes(direction, line);
    const result = mergeLine(indexes.map((index) => board[index]));

    indexes.forEach((boardIndex, index) => {
      nextBoard[boardIndex] = result.line[index];
    });
    didMerge = didMerge || result.didMerge;
    gainedScore += result.gainedScore;
    maxTile = Math.max(maxTile, result.maxTile);
  }

  return {
    board: nextBoard,
    changed: nextBoard.some((value, index) => value !== board[index]),
    didMerge,
    gainedScore,
    maxTile,
  };
}

function canMove(board: number[]) {
  if (board.some((value) => value === 0)) {
    return true;
  }

  return board.some((value, index) => {
    const x = index % GRID_SIZE;
    const y = Math.floor(index / GRID_SIZE);
    const right = x < GRID_SIZE - 1 ? board[index + 1] : null;
    const down = y < GRID_SIZE - 1 ? board[index + GRID_SIZE] : null;

    return value === right || value === down;
  });
}

function getTileClassName(value: number) {
  return (
    tileStyles[value] ??
    "border-white/50 bg-gradient-to-br from-cyan-200 via-fuchsia-200 to-amber-100 text-zinc-950 shadow-[0_0_42px_rgba(255,255,255,0.42)]"
  );
}

export default function Game2048Page() {
  const touchStartRef = useRef<Point | null>(null);
  const previousGameOverRef = useRef(false);
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [bestScore, setBestScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const game = getGame("2048");

  useEffect(() => {
    const loadStoredSettings = window.setTimeout(() => {
      setBestScore(readBestScore());
      setIsSoundEnabled(readSoundPreference());
      setUnlockedAchievements(readUnlockedAchievements("2048"));
    }, 0);

    return () => {
      window.clearTimeout(loadStoredSettings);
    };
  }, []);

  useEffect(() => {
    if (state.score <= bestScore) {
      return;
    }

    const saveNewBestScore = window.setTimeout(() => {
      setBestScore((currentBestScore) => {
        if (state.score <= currentBestScore) {
          return currentBestScore;
        }

        saveBestScore(state.score);
        return state.score;
      });
    }, 0);

    return () => {
      window.clearTimeout(saveNewBestScore);
    };
  }, [bestScore, state.score]);

  useEffect(() => {
    if (state.gameOver && !previousGameOverRef.current) {
      playSound("game-over", isSoundEnabled);
    }

    previousGameOverRef.current = state.gameOver;
  }, [isSoundEnabled, state.gameOver]);

  const unlock2048Achievements = useCallback((result: MoveResult) => {
    const achievementsToUnlock: AchievementId[] = [];

    if (result.didMerge) {
      achievementsToUnlock.push("first-merge");
    }

    if (result.maxTile >= 512) {
      achievementsToUnlock.push("512-club");
    }

    if (result.maxTile >= 2048) {
      achievementsToUnlock.push("2048-legend");
    }

    if (achievementsToUnlock.length > 0) {
      setUnlockedAchievements(
        unlockAchievements("2048", achievementsToUnlock),
      );
    }
  }, []);

  const startGame = () => {
    unlockAudio();
    recordGameStarted("2048");
    previousGameOverRef.current = false;
    setState(createInitialState());
    setHasStarted(true);
  };

  const restart = () => {
    startGame();
  };

  const move = useCallback(
    (direction: Direction) => {
      if (!hasStarted) {
        return;
      }

      unlockAudio();
      setState((current) => {
        if (current.gameOver) {
          return current;
        }

        const result = moveBoard(current.board, direction);

        if (!result.changed) {
          return current;
        }

        const nextBoard = addRandomTile(result.board);
        const nextState = {
          board: nextBoard,
          gameOver: !canMove(nextBoard),
          maxTile: Math.max(result.maxTile, ...nextBoard),
          score: current.score + result.gainedScore,
        };

        unlock2048Achievements({
          ...result,
          maxTile: nextState.maxTile,
        });
        playSound(result.didMerge ? "collect" : "move", isSoundEnabled);

        if (result.maxTile < 512 && nextState.maxTile >= 512) {
          playSound("milestone", isSoundEnabled);
        }

        if (result.maxTile < 2048 && nextState.maxTile >= 2048) {
          playSound("win", isSoundEnabled);
        }

        return nextState;
      });
    },
    [hasStarted, isSoundEnabled, unlock2048Achievements],
  );

  useEffect(() => {
    const directionByKey: Partial<Record<string, Direction>> = {
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = directionByKey[event.key];

      if (direction) {
        event.preventDefault();
        move(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [move]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];

    if (!touch) {
      return;
    }

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;

    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SWIPE_THRESHOLD_PX) {
      return;
    }

    event.preventDefault();
    move(
      Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX > 0
          ? "right"
          : "left"
        : deltaY > 0
          ? "down"
          : "up",
    );
  };

  const toggleSound = () => {
    unlockAudio();
    setIsSoundEnabled((current) => {
      const nextValue = !current;
      saveSoundPreference(nextValue);

      return nextValue;
    });
  };

  if (!game) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060d] px-4 py-4 text-white sm:px-6 lg:px-8">
      <div className="arcade-drift absolute -inset-8 -z-20 bg-[radial-gradient(circle_at_18%_16%,rgba(190,242,100,0.24),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(244,114,182,0.13),transparent_34%),linear-gradient(135deg,#05060d_0%,#07140f_52%,#07131f_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
      <div className="arcade-scanlines pointer-events-none absolute inset-0 -z-10 opacity-[0.07]" />

      <header className="mx-auto flex max-w-[1800px] items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.26em] text-zinc-200"
        >
          Arcade Hub
        </Link>
        <Link
          href="/#games"
          className="rounded-md border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-200 transition hover:border-cyan-200/50 hover:text-cyan-100"
        >
          Back
        </Link>
      </header>

      <section className="mx-auto grid max-w-[1800px] gap-3 py-3 lg:min-h-[calc(100vh-76px)] lg:grid-cols-[minmax(280px,0.52fr)_minmax(640px,1.48fr)] lg:items-stretch lg:gap-5 lg:py-5">
        <div className="order-2 flex flex-col justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-3 backdrop-blur-sm lg:order-1 lg:gap-5 lg:p-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-200">
              {game.label}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-none tracking-normal sm:text-6xl lg:mt-3 lg:text-7xl">
              {game.title}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base lg:mt-5 lg:text-lg lg:leading-8">
              {game.description}
            </p>

            <div className="mt-4 grid max-w-xl grid-cols-2 gap-2 lg:mt-8 lg:gap-3 xl:grid-cols-4">
              <div className="flex min-h-22 flex-col justify-between rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 sm:px-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-100 sm:text-[11px]">
                  Score
                </p>
                <p className="mt-2 text-3xl font-black leading-none text-white tabular-nums">
                  {state.score}
                </p>
              </div>
              <div className="flex min-h-22 flex-col justify-between rounded-md border border-sky-300/20 bg-sky-300/10 px-3 py-3 sm:px-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sky-100 sm:text-[11px]">
                  Best Score
                </p>
                <p className="mt-2 text-3xl font-black leading-none text-white tabular-nums">
                  {bestScore}
                </p>
              </div>
              <div className="flex min-h-22 flex-col justify-between rounded-md border border-lime-300/20 bg-lime-300/10 px-3 py-3 sm:px-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime-100 sm:text-[11px]">
                  Max Tile
                </p>
                <p className="mt-2 text-3xl font-black leading-none text-white tabular-nums">
                  {state.maxTile}
                </p>
              </div>
              <div className="flex min-h-22 flex-col justify-between rounded-md border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-3 sm:px-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fuchsia-100 sm:text-[11px]">
                  Status
                </p>
                <p className="mt-2 text-lg font-black uppercase leading-none tracking-[0.12em] text-white sm:text-xl">
                  {state.gameOver ? "Game Over" : hasStarted ? "Live" : "Ready"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 lg:mt-6 lg:gap-3">
              <button
                type="button"
                onClick={hasStarted ? restart : startGame}
                className="h-12 rounded-md bg-lime-300 px-6 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-lime-200"
              >
                {hasStarted ? "Restart" : "Start Game"}
              </button>
              <button
                type="button"
                onClick={toggleSound}
                className="h-12 rounded-md border border-white/10 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-lime-200/50 hover:bg-lime-300/10"
              >
                Sound {isSoundEnabled ? "On" : "Off"}
              </button>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-400">
                Arrow keys or swipe to slide
              </p>
            </div>
          </div>

          <div className="max-w-xl rounded-md border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-400">
                Achievements
              </p>
              <p className="text-xs font-bold text-lime-100">
                {unlockedAchievements.length}/{achievementDefinitions["2048"].length}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {achievementDefinitions["2048"].map((achievement) => {
                const isUnlocked = unlockedAchievements.includes(achievement.id);

                return (
                  <div
                    key={achievement.id}
                    className={`rounded-md border px-3 py-3 ${
                      isUnlocked
                        ? "border-lime-300/25 bg-lime-300/10 text-white"
                        : "border-white/10 bg-black/20 text-zinc-500"
                    }`}
                  >
                    <p className="text-sm font-black">{achievement.title}</p>
                    <p className="mt-1 text-xs leading-5">
                      {achievement.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`order-1 relative overflow-hidden rounded-lg border bg-white/[0.035] p-2 shadow-2xl transition duration-500 sm:p-3 lg:order-2 lg:p-5 ${
          state.gameOver
            ? "border-fuchsia-300/50 shadow-fuchsia-950/50"
            : "border-lime-200/20 shadow-emerald-950/40"
        }`}>
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.accent}`} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(190,242,100,0.13),transparent_48%)]" />
          <div
            className="relative flex h-full min-h-[calc(100svh-104px)] touch-none items-center justify-center rounded-md border border-lime-300/20 bg-black/45 p-2 shadow-[inset_0_0_60px_rgba(190,242,100,0.11),0_0_50px_rgba(34,211,238,0.1)] sm:p-4 lg:min-h-[min(74vh,920px)]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => {
              touchStartRef.current = null;
            }}
          >
            <div className="grid aspect-square w-full max-w-[min(96vw,calc(100svh-124px))] grid-cols-4 gap-2 rounded-lg border border-white/10 bg-black/35 p-2 shadow-[0_0_44px_rgba(190,242,100,0.16)] sm:gap-3 sm:p-3 lg:max-w-[min(88vh,860px)] lg:gap-4 lg:p-4">
              {state.board.map((value, index) => (
                <div
                  key={index}
                  className={`grid min-w-0 place-items-center rounded-md border text-2xl font-black tracking-normal transition duration-150 sm:text-4xl lg:text-5xl ${
                    value === 0
                      ? "border-white/8 bg-white/[0.045]"
                      : getTileClassName(value)
                  }`}
                >
                  {value === 0 ? null : value}
                </div>
              ))}
            </div>

            {!hasStarted ? (
              <div className="absolute inset-2 grid place-items-center rounded-sm bg-black/72 p-5 backdrop-blur-sm sm:inset-4">
                <div className="max-w-sm text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-lime-200">
                    Tile engine ready
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-normal text-white sm:text-5xl">
                    2048
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    Start the board, then slide tiles with arrow keys or swipes.
                  </p>
                  <button
                    type="button"
                    onClick={startGame}
                    className="mt-6 h-12 rounded-md bg-lime-300 px-6 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-lime-200"
                  >
                    Start Game
                  </button>
                </div>
              </div>
            ) : state.gameOver ? (
              <div className="absolute inset-2 grid place-items-center rounded-sm bg-black/75 p-5 backdrop-blur-sm sm:inset-4">
                <div className="max-w-sm text-center">
                  <p className="danger-pulse font-mono text-xs uppercase tracking-[0.28em] text-fuchsia-200">
                    No merges remain
                  </p>
                  <h2 className="mt-3 text-5xl font-black tracking-normal text-white">
                    Game Over
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    Final score: {state.score}. Restart the board and build a
                    stronger chain.
                  </p>
                  <button
                    type="button"
                    onClick={restart}
                    className="mt-6 h-11 rounded-md bg-fuchsia-300 px-5 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-fuchsia-200"
                  >
                    Restart
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
