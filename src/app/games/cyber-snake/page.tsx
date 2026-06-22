"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getGame } from "@/lib/games";

const GRID_SIZE = 24;
const CANVAS_SIZE = 576;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const TICK_RATE_MS = 105;

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
  const [state, setState] = useState<GameState>(() => createInitialState());
  const game = getGame("cyber-snake");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const directionByKey: Partial<Record<string, Direction>> = {
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
      };
      const nextDirection = directionByKey[event.key];

      if (!nextDirection) {
        return;
      }

      event.preventDefault();
      setState((current) => {
        if (current.gameOver || isOpposite(current.direction, nextDirection)) {
          return current;
        }

        return {
          ...current,
          nextDirection,
        };
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (state.gameOver) {
      return;
    }

    const tick = window.setInterval(() => {
      setState((current) => advanceGame(current));
    }, TICK_RATE_MS);

    return () => {
      window.clearInterval(tick);
    };
  }, [state.gameOver]);

  useEffect(() => {
    if (canvasRef.current) {
      drawGame(canvasRef.current, state);
    }
  }, [state]);

  if (!game) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060d] px-6 py-6 text-white sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_16%,rgba(16,185,129,0.22),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(244,114,182,0.12),transparent_34%),linear-gradient(135deg,#05060d_0%,#08101a_52%,#100814_100%)]" />
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
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-emerald-200">
            {game.label}
          </p>
          <h1 className="mt-4 text-5xl font-black leading-none tracking-normal sm:text-7xl">
            {game.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
            {game.description}
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                Score
              </p>
              <p className="mt-1 text-3xl font-black text-white">{state.score}</p>
            </div>
            <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-100">
                Length
              </p>
              <p className="mt-1 text-3xl font-black text-white">
                {state.snake.length}
              </p>
            </div>
            <div className="rounded-md border border-fuchsia-300/20 bg-fuchsia-300/10 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fuchsia-100">
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
              onClick={() => setState(createInitialState())}
              className="h-12 rounded-md bg-cyan-300 px-6 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-cyan-200"
            >
              Restart
            </button>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-400">
              Arrow keys to steer
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/40 sm:p-5">
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.accent}`} />
          <div className="relative rounded-md border border-cyan-300/20 bg-black/35 p-3 shadow-[inset_0_0_32px_rgba(34,211,238,0.08)] sm:p-4">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              aria-label="Cyber Snake game board"
              className="block aspect-square w-full rounded-sm border border-white/10 bg-[#05060d]"
            />

            {state.gameOver ? (
              <div className="absolute inset-3 grid place-items-center rounded-sm bg-black/72 p-5 backdrop-blur-sm sm:inset-4">
                <div className="max-w-sm text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-fuchsia-200">
                    Run terminated
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-normal text-white">
                    Game Over
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    Final score: {state.score}. Restart the grid and chase the
                    next signal.
                  </p>
                  <button
                    type="button"
                    onClick={() => setState(createInitialState())}
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
