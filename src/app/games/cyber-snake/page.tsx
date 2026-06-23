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

const GRID_SIZE = 24;
const CANVAS_SIZE = 576;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const TICK_RATE_MS = 105;
const SWIPE_THRESHOLD_PX = 32;
const BEST_SCORE_STORAGE_KEY = "arcade-hub:cyber-snake:best-score";

type Direction = "up" | "down" | "left" | "right";

type Point = {
  x: number;
  y: number;
};

type GameState = {
  direction: Direction;
  food: Point;
  gameOver: boolean;
  nextDirection: Direction;
  score: number;
  snake: Point[];
};

const initialSnake: Point[] = [
  { x: 12, y: 12 },
  { x: 11, y: 12 },
  { x: 10, y: 12 },
];

function pointsMatch(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function isOpposite(a: Direction, b: Direction) {
  return (
    (a === "up" && b === "down") ||
    (a === "down" && b === "up") ||
    (a === "left" && b === "right") ||
    (a === "right" && b === "left")
  );
}

function getNextHead(head: Point, direction: Direction): Point {
  if (direction === "up") {
    return { x: head.x, y: head.y - 1 };
  }

  if (direction === "down") {
    return { x: head.x, y: head.y + 1 };
  }

  if (direction === "left") {
    return { x: head.x - 1, y: head.y };
  }

  return { x: head.x + 1, y: head.y };
}

function spawnFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((segment) => `${segment.x}:${segment.y}`));
  const openCells: Point[] = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!occupied.has(`${x}:${y}`)) {
        openCells.push({ x, y });
      }
    }
  }

  return openCells[Math.floor(Math.random() * openCells.length)] ?? { x: 0, y: 0 };
}

function createInitialState(): GameState {
  return {
    direction: "right",
    food: spawnFood(initialSnake),
    gameOver: false,
    nextDirection: "right",
    score: 0,
    snake: initialSnake,
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

function advanceGame(state: GameState): GameState {
  if (state.gameOver) {
    return state;
  }

  const direction = isOpposite(state.direction, state.nextDirection)
    ? state.direction
    : state.nextDirection;
  const head = getNextHead(state.snake[0], direction);
  const ateFood = pointsMatch(head, state.food);
  const nextSnake = ateFood
    ? [head, ...state.snake]
    : [head, ...state.snake.slice(0, -1)];

  const hitWall =
    head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
  const hitSelf = nextSnake
    .slice(1)
    .some((segment) => pointsMatch(segment, head));

  if (hitWall || hitSelf) {
    return {
      ...state,
      direction,
      gameOver: true,
      nextDirection: direction,
    };
  }

  return {
    direction,
    food: ateFood ? spawnFood(nextSnake) : state.food,
    gameOver: false,
    nextDirection: direction,
    score: ateFood ? state.score + 10 : state.score,
    snake: nextSnake,
  };
}

function drawGame(canvas: HTMLCanvasElement, state: GameState) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const background = context.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  background.addColorStop(0, "#07111c");
  background.addColorStop(0.56, "#05060d");
  background.addColorStop(1, "#0c111f");
  context.fillStyle = background;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  context.strokeStyle = "rgba(103, 232, 249, 0.08)";
  context.lineWidth = 1;

  for (let index = 0; index <= GRID_SIZE; index += 1) {
    const position = index * CELL_SIZE;
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, CANVAS_SIZE);
    context.stroke();

    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(CANVAS_SIZE, position);
    context.stroke();
  }

  const foodCenterX = state.food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodCenterY = state.food.y * CELL_SIZE + CELL_SIZE / 2;
  const foodGlow = context.createRadialGradient(
    foodCenterX,
    foodCenterY,
    2,
    foodCenterX,
    foodCenterY,
    CELL_SIZE,
  );
  foodGlow.addColorStop(0, "rgba(244, 114, 182, 0.95)");
  foodGlow.addColorStop(1, "rgba(244, 114, 182, 0)");
  context.fillStyle = foodGlow;
  context.fillRect(
    state.food.x * CELL_SIZE,
    state.food.y * CELL_SIZE,
    CELL_SIZE,
    CELL_SIZE,
  );
  context.fillStyle = "#f0abfc";
  context.fillRect(
    state.food.x * CELL_SIZE + 6,
    state.food.y * CELL_SIZE + 6,
    CELL_SIZE - 12,
    CELL_SIZE - 12,
  );

  state.snake.forEach((segment, index) => {
    const x = segment.x * CELL_SIZE;
    const y = segment.y * CELL_SIZE;
    const inset = index === 0 ? 3 : 4;

    context.shadowBlur = index === 0 ? 22 : 14;
    context.shadowColor = index === 0 ? "#67e8f9" : "#34d399";
    context.fillStyle = index === 0 ? "#67e8f9" : "#34d399";
    context.fillRect(x + inset, y + inset, CELL_SIZE - inset * 2, CELL_SIZE - inset * 2);

    context.shadowBlur = 0;
    context.fillStyle = "rgba(5, 6, 13, 0.25)";
    context.fillRect(x + inset + 4, y + inset + 4, CELL_SIZE - inset * 2 - 8, 3);
  });
}

export default function CyberSnakePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousGameOverRef = useRef(false);
  const previousScoreRef = useRef(0);
  const touchStartRef = useRef<Point | null>(null);
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [bestScore, setBestScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [scorePulseKey, setScorePulseKey] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const game = getGame("cyber-snake");

  useEffect(() => {
    const loadStoredSettings = window.setTimeout(() => {
      setBestScore(readBestScore());
      setIsSoundEnabled(readSoundPreference());
      setUnlockedAchievements(readUnlockedAchievements("cyber-snake"));
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
    const achievementsToUnlock: AchievementId[] = [];

    if (state.score >= 10) {
      achievementsToUnlock.push("first-bite");
    }

    if (state.score >= 25) {
      achievementsToUnlock.push("snake-apprentice");
    }

    if (state.score >= 50) {
      achievementsToUnlock.push("snake-master");
    }

    if (achievementsToUnlock.length === 0) {
      return;
    }

    const unlockScoreAchievements = window.setTimeout(() => {
      setUnlockedAchievements(
        unlockAchievements("cyber-snake", achievementsToUnlock),
      );
    }, 0);

    return () => {
      window.clearTimeout(unlockScoreAchievements);
    };
  }, [state.score]);

  const queueDirection = useCallback((nextDirection: Direction) => {
    if (!hasStarted) {
      return;
    }

    unlockAudio();
    setState((current) => {
      if (current.gameOver || isOpposite(current.direction, nextDirection)) {
        return current;
      }

      return {
        ...current,
        nextDirection,
      };
    });
  }, [hasStarted]);

  useEffect(() => {
    const directionByKey: Partial<Record<string, Direction>> = {
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const nextDirection = directionByKey[event.key];

      if (nextDirection) {
        event.preventDefault();
        queueDirection(nextDirection);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [queueDirection]);

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

    if (
      Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SWIPE_THRESHOLD_PX
    ) {
      return;
    }

    event.preventDefault();
    queueDirection(
      Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX > 0
          ? "right"
          : "left"
        : deltaY > 0
          ? "down"
          : "up",
    );
  };

  useEffect(() => {
    if (!hasStarted || state.gameOver) {
      return;
    }

    const tick = window.setInterval(() => {
      setState((current) => advanceGame(current));
    }, TICK_RATE_MS);

    return () => {
      window.clearInterval(tick);
    };
  }, [hasStarted, state.gameOver]);

  useEffect(() => {
    if (canvasRef.current) {
      drawGame(canvasRef.current, state);
    }
  }, [state]);

  useEffect(() => {
    if (state.score > previousScoreRef.current) {
      playSound("collect", isSoundEnabled);
      setScorePulseKey((current) => current + 1);
    }

    previousScoreRef.current = state.score;
  }, [isSoundEnabled, state.score]);

  useEffect(() => {
    if (state.gameOver && !previousGameOverRef.current) {
      playSound("game-over", isSoundEnabled);
    }

    previousGameOverRef.current = state.gameOver;
  }, [isSoundEnabled, state.gameOver]);

  const restart = () => {
    unlockAudio();
    recordGameStarted("cyber-snake");
    setHasStarted(true);
    previousGameOverRef.current = false;
    previousScoreRef.current = 0;
    setState(createInitialState());
  };

  const startGame = () => {
    unlockAudio();
    recordGameStarted("cyber-snake");
    setHasStarted(true);
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
      <div className="arcade-drift absolute -inset-8 -z-20 bg-[radial-gradient(circle_at_18%_16%,rgba(16,185,129,0.28),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(244,114,182,0.16),transparent_34%),linear-gradient(135deg,#05060d_0%,#08101a_52%,#100814_100%)]" />
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
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-emerald-200">
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
              <p
                key={scorePulseKey}
                className="score-pop mt-2 text-3xl font-black leading-none text-white tabular-nums"
              >
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
            <div className="flex min-h-22 flex-col justify-between rounded-md border border-emerald-300/20 bg-emerald-300/10 px-3 py-3 sm:px-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-100 sm:text-[11px]">
                Length
              </p>
              <p className="mt-2 text-3xl font-black leading-none text-white tabular-nums">
                {state.snake.length}
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
              className="h-12 rounded-md bg-cyan-300 px-6 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-cyan-200"
            >
              {hasStarted ? "Restart" : "Start Game"}
            </button>
            <button
              type="button"
              onClick={toggleSound}
              className="h-12 rounded-md border border-white/10 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-cyan-200/50 hover:bg-cyan-300/10"
            >
              Sound {isSoundEnabled ? "On" : "Off"}
            </button>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-400">
              Arrow keys to steer
            </p>
          </div>
          </div>

          <div className="max-w-xl rounded-md border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-400">
                Achievements
              </p>
              <p className="text-xs font-bold text-cyan-100">
                {unlockedAchievements.length}/
                {achievementDefinitions["cyber-snake"].length}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {achievementDefinitions["cyber-snake"].map((achievement) => {
                const isUnlocked = unlockedAchievements.includes(achievement.id);

                return (
                  <div
                    key={achievement.id}
                    className={`rounded-md border px-3 py-3 ${
                      isUnlocked
                        ? "border-cyan-300/25 bg-cyan-300/10 text-white"
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
            : "border-cyan-200/20 shadow-cyan-950/40"
        }`}>
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.accent}`} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.12),transparent_48%)]" />
          <div className="relative flex h-full min-h-[calc(100svh-104px)] items-center justify-center rounded-md border border-cyan-300/20 bg-black/45 p-1 shadow-[inset_0_0_60px_rgba(34,211,238,0.13),0_0_50px_rgba(34,211,238,0.12)] sm:p-3 lg:min-h-[min(74vh,920px)] lg:p-4">
            <div
              className="touch-none w-full max-w-[min(96vw,calc(100svh-124px))] lg:max-w-[min(88vh,980px)]"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={() => {
                touchStartRef.current = null;
              }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                aria-label="Cyber Snake game board"
                className={`block aspect-square w-full rounded-sm border bg-[#05060d] shadow-[0_0_44px_rgba(16,185,129,0.22)] transition duration-500 ${
                  state.gameOver ? "border-fuchsia-300/70" : "border-cyan-200/30"
                }`}
              />
            </div>

            {!hasStarted ? (
              <div className="absolute inset-2 grid place-items-center rounded-sm bg-black/72 p-5 backdrop-blur-sm sm:inset-4">
                <div className="max-w-sm text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                    Ready signal
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-normal text-white sm:text-5xl">
                    Cyber Snake
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    Start the run, then steer with swipes or arrow keys.
                  </p>
                  <button
                    type="button"
                    onClick={startGame}
                    className="mt-6 h-12 rounded-md bg-cyan-300 px-6 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-cyan-200"
                  >
                    Start Game
                  </button>
                </div>
              </div>
            ) : state.gameOver ? (
              <div className="absolute inset-2 grid place-items-center rounded-sm bg-black/75 p-5 backdrop-blur-sm sm:inset-4">
                <div className="max-w-sm text-center">
                  <p className="danger-pulse font-mono text-xs uppercase tracking-[0.28em] text-fuchsia-200">
                    Run terminated
                  </p>
                  <h2 className="mt-3 text-5xl font-black tracking-normal text-white">
                    Game Over
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    Final score: {state.score}. Restart the grid and chase the
                    next signal.
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
