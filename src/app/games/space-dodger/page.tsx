"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 720;
const PLAYER_WIDTH = 54;
const PLAYER_HEIGHT = 68;
const PLAYER_Y = CANVAS_HEIGHT - 92;
const PLAYER_SPEED = 430;
const ASTEROID_SPAWN_MS = 720;
const SCORE_RATE = 14;
const BEST_SCORE_STORAGE_KEY = "arcade-hub:space-dodger:best-score";

type Asteroid = {
  id: number;
  radius: number;
  rotation: number;
  speed: number;
  x: number;
  y: number;
};

type Player = {
  x: number;
};

type GameState = {
  asteroids: Asteroid[];
  elapsedSeconds: number;
  gameOver: boolean;
  player: Player;
  score: number;
};

type InputState = {
  left: boolean;
  right: boolean;
};

function createInitialState(): GameState {
  return {
    asteroids: [],
    elapsedSeconds: 0,
    gameOver: false,
    player: {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    },
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createAsteroid(id: number, elapsedSeconds: number): Asteroid {
  const radius = 18 + Math.random() * 24;
  const speed = 150 + Math.random() * 105 + Math.min(elapsedSeconds * 5, 150);

  return {
    id,
    radius,
    rotation: Math.random() * Math.PI,
    speed,
    x: radius + Math.random() * (CANVAS_WIDTH - radius * 2),
    y: -radius,
  };
}

function rectCircleCollide(
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
  circleX: number,
  circleY: number,
  circleRadius: number,
) {
  const closestX = clamp(circleX, rectX, rectX + rectWidth);
  const closestY = clamp(circleY, rectY, rectY + rectHeight);
  const distanceX = circleX - closestX;
  const distanceY = circleY - closestY;

  return distanceX * distanceX + distanceY * distanceY <= circleRadius * circleRadius;
}

function drawShip(
  context: CanvasRenderingContext2D,
  player: Player,
  input: InputState,
) {
  const centerX = player.x + PLAYER_WIDTH / 2;
  const flameShift = input.left ? 8 : input.right ? -8 : 0;

  context.save();
  context.shadowColor = "#67e8f9";
  context.shadowBlur = 22;
  context.fillStyle = "#67e8f9";
  context.beginPath();
  context.moveTo(centerX, PLAYER_Y);
  context.lineTo(player.x + PLAYER_WIDTH, PLAYER_Y + PLAYER_HEIGHT - 14);
  context.lineTo(centerX + 12, PLAYER_Y + PLAYER_HEIGHT);
  context.lineTo(centerX, PLAYER_Y + PLAYER_HEIGHT - 14);
  context.lineTo(centerX - 12, PLAYER_Y + PLAYER_HEIGHT);
  context.lineTo(player.x, PLAYER_Y + PLAYER_HEIGHT - 14);
  context.closePath();
  context.fill();

  context.shadowBlur = 0;
  context.fillStyle = "#101827";
  context.beginPath();
  context.moveTo(centerX, PLAYER_Y + 15);
  context.lineTo(centerX + 14, PLAYER_Y + PLAYER_HEIGHT - 18);
  context.lineTo(centerX - 14, PLAYER_Y + PLAYER_HEIGHT - 18);
  context.closePath();
  context.fill();

  context.fillStyle = "#f0abfc";
  context.shadowColor = "#f0abfc";
  context.shadowBlur = 18;
  context.beginPath();
  context.moveTo(centerX + flameShift, PLAYER_Y + PLAYER_HEIGHT + 16);
  context.lineTo(centerX + 11, PLAYER_Y + PLAYER_HEIGHT - 4);
  context.lineTo(centerX - 11, PLAYER_Y + PLAYER_HEIGHT - 4);
  context.closePath();
  context.fill();
  context.restore();
}

function drawAsteroid(context: CanvasRenderingContext2D, asteroid: Asteroid) {
  const edges = 8;

  context.save();
  context.translate(asteroid.x, asteroid.y);
  context.rotate(asteroid.rotation + asteroid.y * 0.004);
  context.shadowColor = "#c084fc";
  context.shadowBlur = 15;
  context.fillStyle = "#a78bfa";
  context.strokeStyle = "rgba(255, 255, 255, 0.32)";
  context.lineWidth = 2;
  context.beginPath();

  for (let index = 0; index < edges; index += 1) {
    const angle = (Math.PI * 2 * index) / edges;
    const crag = asteroid.radius * (0.72 + ((index * 29 + asteroid.id) % 5) * 0.08);
    const x = Math.cos(angle) * crag;
    const y = Math.sin(angle) * crag;

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }

  context.closePath();
  context.fill();
  context.stroke();
  context.shadowBlur = 0;
  context.fillStyle = "rgba(5, 6, 13, 0.22)";
  context.beginPath();
  context.arc(-asteroid.radius * 0.22, -asteroid.radius * 0.1, asteroid.radius * 0.18, 0, Math.PI * 2);
  context.arc(asteroid.radius * 0.24, asteroid.radius * 0.22, asteroid.radius * 0.13, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawGame(
  canvas: HTMLCanvasElement,
  state: GameState,
  input: InputState,
) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const background = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  background.addColorStop(0, "#09081a");
  background.addColorStop(0.52, "#05060d");
  background.addColorStop(1, "#06131d");
  context.fillStyle = background;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.strokeStyle = "rgba(103, 232, 249, 0.08)";
  context.lineWidth = 1;
  for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x - 100, CANVAS_HEIGHT);
    context.stroke();
  }

  for (let index = 0; index < 56; index += 1) {
    const x = (index * 97) % CANVAS_WIDTH;
    const y = (index * 151 + Math.floor(state.elapsedSeconds * 32)) % CANVAS_HEIGHT;
    context.fillStyle =
      index % 7 === 0 ? "rgba(244, 114, 182, 0.72)" : "rgba(255, 255, 255, 0.54)";
    context.fillRect(x, y, index % 7 === 0 ? 3 : 2, index % 7 === 0 ? 3 : 2);
  }

  state.asteroids.forEach((asteroid) => drawAsteroid(context, asteroid));
  drawShip(context, state.player, input);
}

function advanceGame(
  state: GameState,
  input: InputState,
  deltaSeconds: number,
): GameState {
  if (state.gameOver) {
    return state;
  }

  const direction = Number(input.right) - Number(input.left);
  const playerX = clamp(
    state.player.x + direction * PLAYER_SPEED * deltaSeconds,
    10,
    CANVAS_WIDTH - PLAYER_WIDTH - 10,
  );
  const elapsedSeconds = state.elapsedSeconds + deltaSeconds;
  const asteroids = state.asteroids
    .map((asteroid) => ({
      ...asteroid,
      y: asteroid.y + asteroid.speed * deltaSeconds,
    }))
    .filter((asteroid) => asteroid.y - asteroid.radius < CANVAS_HEIGHT + 40);

  const playerHitBox = {
    height: PLAYER_HEIGHT - 14,
    width: PLAYER_WIDTH - 14,
    x: playerX + 7,
    y: PLAYER_Y + 8,
  };
  const collision = asteroids.some((asteroid) =>
    rectCircleCollide(
      playerHitBox.x,
      playerHitBox.y,
      playerHitBox.width,
      playerHitBox.height,
      asteroid.x,
      asteroid.y,
      asteroid.radius * 0.82,
    ),
  );

  return {
    asteroids,
    elapsedSeconds,
    gameOver: collision,
    player: {
      x: playerX,
    },
    score: Math.floor(elapsedSeconds * SCORE_RATE),
  };
}

export default function SpaceDodgerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<InputState>({ left: false, right: false });
  const lastFrameRef = useRef<number | null>(null);
  const asteroidIdRef = useRef(0);
  const previousGameOverRef = useRef(false);
  const previousMilestoneRef = useRef(0);
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [bestScore, setBestScore] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const game = getGame("space-dodger");

  useEffect(() => {
    const loadStoredSettings = window.setTimeout(() => {
      setBestScore(readBestScore());
      setIsSoundEnabled(readSoundPreference());
      setUnlockedAchievements(readUnlockedAchievements("space-dodger"));
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

    if (state.score >= 30) {
      achievementsToUnlock.push("survivor");
    }

    if (state.score >= 60) {
      achievementsToUnlock.push("veteran-pilot");
    }

    if (state.score >= 120) {
      achievementsToUnlock.push("space-legend");
    }

    if (achievementsToUnlock.length === 0) {
      return;
    }

    const unlockScoreAchievements = window.setTimeout(() => {
      setUnlockedAchievements(
        unlockAchievements("space-dodger", achievementsToUnlock),
      );
    }, 0);

    return () => {
      window.clearTimeout(unlockScoreAchievements);
    };
  }, [state.score]);

  useEffect(() => {
    const setKey = (key: string, isPressed: boolean) => {
      if (key === "ArrowLeft") {
        inputRef.current.left = isPressed;
        return true;
      }

      if (key === "ArrowRight") {
        inputRef.current.right = isPressed;
        return true;
      }

      return false;
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (setKey(event.key, true)) {
        event.preventDefault();
        unlockAudio();
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (setKey(event.key, false)) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (state.gameOver) {
      lastFrameRef.current = null;
      return;
    }

    let frameId = 0;
    const animate = (timestamp: number) => {
      const lastFrame = lastFrameRef.current ?? timestamp;
      const deltaSeconds = Math.min((timestamp - lastFrame) / 1000, 0.04);

      lastFrameRef.current = timestamp;
      setState((current) => advanceGame(current, inputRef.current, deltaSeconds));
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [state.gameOver]);

  useEffect(() => {
    if (state.gameOver) {
      return;
    }

    const spawn = window.setInterval(() => {
      setState((current) => {
        if (current.gameOver) {
          return current;
        }

        asteroidIdRef.current += 1;

        return {
          ...current,
          asteroids: [
            ...current.asteroids,
            createAsteroid(asteroidIdRef.current, current.elapsedSeconds),
          ],
        };
      });
    }, ASTEROID_SPAWN_MS);

    return () => {
      window.clearInterval(spawn);
    };
  }, [state.gameOver]);

  useEffect(() => {
    if (canvasRef.current) {
      drawGame(canvasRef.current, state, inputRef.current);
    }
  }, [state]);

  useEffect(() => {
    if (state.gameOver && !previousGameOverRef.current) {
      playSound("game-over", isSoundEnabled);
    }

    previousGameOverRef.current = state.gameOver;
  }, [isSoundEnabled, state.gameOver]);

  useEffect(() => {
    const milestone = Math.floor(state.score / 100);

    if (milestone > previousMilestoneRef.current) {
      playSound("milestone", isSoundEnabled);
    }

    previousMilestoneRef.current = milestone;
  }, [isSoundEnabled, state.score]);

  const restart = () => {
    unlockAudio();
    inputRef.current = { left: false, right: false };
    lastFrameRef.current = null;
    asteroidIdRef.current = 0;
    previousGameOverRef.current = false;
    previousMilestoneRef.current = 0;
    setState(createInitialState());
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
    <main className="relative min-h-screen overflow-hidden bg-[#05060d] px-6 py-6 text-white sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_16%,rgba(217,70,239,0.2),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(167,139,250,0.14),transparent_34%),linear-gradient(135deg,#05060d_0%,#09091a_52%,#06141f_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />

      <header className="mx-auto flex max-w-6xl items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
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

      <section className="mx-auto grid max-w-6xl items-center gap-8 py-10 lg:min-h-[calc(100vh-96px)] lg:grid-cols-[0.82fr_1.18fr] lg:py-14">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-fuchsia-200">
            {game.label}
          </p>
          <h1 className="mt-4 text-5xl font-black leading-none tracking-normal sm:text-7xl">
            {game.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
            {game.description}
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                Score
              </p>
              <p className="mt-1 text-3xl font-black text-white">{state.score}</p>
            </div>
            <div className="rounded-md border border-sky-300/20 bg-sky-300/10 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sky-100">
                Best Score
              </p>
              <p className="mt-1 text-3xl font-black text-white">{bestScore}</p>
            </div>
            <div className="rounded-md border border-fuchsia-300/20 bg-fuchsia-300/10 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fuchsia-100">
                Time
              </p>
              <p className="mt-1 text-3xl font-black text-white">
                {state.elapsedSeconds.toFixed(1)}
              </p>
            </div>
            <div className="rounded-md border border-violet-300/20 bg-violet-300/10 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet-100">
                Status
              </p>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-white">
                {state.gameOver ? "Game Over" : "Live"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={restart}
              className="h-12 rounded-md bg-cyan-300 px-6 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-cyan-200"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={toggleSound}
              className="h-12 rounded-md border border-white/10 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-fuchsia-200/50 hover:bg-fuchsia-300/10"
            >
              Sound {isSoundEnabled ? "On" : "Off"}
            </button>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-400">
              Arrow keys move left / right
            </p>
          </div>

          <div className="mt-6 max-w-xl rounded-md border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-400">
                Achievements
              </p>
              <p className="text-xs font-bold text-fuchsia-100">
                {unlockedAchievements.length}/
                {achievementDefinitions["space-dodger"].length}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {achievementDefinitions["space-dodger"].map((achievement) => {
                const isUnlocked = unlockedAchievements.includes(achievement.id);

                return (
                  <div
                    key={achievement.id}
                    className={`rounded-md border px-3 py-3 ${
                      isUnlocked
                        ? "border-fuchsia-300/25 bg-fuchsia-300/10 text-white"
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

        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/40 sm:p-5">
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.accent}`} />
          <div className="relative rounded-md border border-fuchsia-300/20 bg-black/35 p-3 shadow-[inset_0_0_32px_rgba(217,70,239,0.08)] sm:p-4">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              aria-label="Space Dodger game board"
              className="block aspect-[8/9] w-full rounded-sm border border-white/10 bg-[#05060d]"
            />

            {state.gameOver ? (
              <div className="absolute inset-3 grid place-items-center rounded-sm bg-black/72 p-5 backdrop-blur-sm sm:inset-4">
                <div className="max-w-sm text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-fuchsia-200">
                    Hull breach detected
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-normal text-white">
                    Game Over
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    Final score: {state.score}. Reboot the thrusters and dodge
                    the next debris field.
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
