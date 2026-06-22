"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  achievementDefinitions,
  incrementAchievementProgress,
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

type Cell = "X" | "O" | null;
type Winner = "X" | "O" | "draw" | null;
type Scoreboard = {
  draws: number;
  losses: number;
  wins: number;
};

const EMPTY_BOARD: Cell[] = Array<Cell>(9).fill(null);
const MATCH_PROGRESS_KEY = "completed-matches";
const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

function getWinningLine(board: Cell[]) {
  return WINNING_LINES.find(([a, b, c]) => {
    const mark = board[a];
    return mark !== null && mark === board[b] && mark === board[c];
  });
}

function getWinner(board: Cell[]): Winner {
  const winningLine = getWinningLine(board);

  if (winningLine) {
    return board[winningLine[0]];
  }

  return board.every(Boolean) ? "draw" : null;
}

function minimax(board: Cell[], isAiTurn: boolean, depth: number): number {
  const winner = getWinner(board);

  if (winner === "O") {
    return 10 - depth;
  }

  if (winner === "X") {
    return depth - 10;
  }

  if (winner === "draw") {
    return 0;
  }

  const openCells = board
    .map((cell, index) => (cell === null ? index : null))
    .filter((index): index is number => index !== null);

  if (isAiTurn) {
    return Math.max(
      ...openCells.map((index) => {
        const nextBoard = [...board];
        nextBoard[index] = "O";
        return minimax(nextBoard, false, depth + 1);
      }),
    );
  }

  return Math.min(
    ...openCells.map((index) => {
      const nextBoard = [...board];
      nextBoard[index] = "X";
      return minimax(nextBoard, true, depth + 1);
    }),
  );
}

function getBestAiMove(board: Cell[]) {
  let bestScore = -Infinity;
  let bestMove = -1;

  board.forEach((cell, index) => {
    if (cell !== null) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = "O";
    const score = minimax(nextBoard, false, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  });

  return bestMove;
}

function updateScoreboard(scoreboard: Scoreboard, winner: Winner): Scoreboard {
  if (winner === "X") {
    return {
      ...scoreboard,
      wins: scoreboard.wins + 1,
    };
  }

  if (winner === "O") {
    return {
      ...scoreboard,
      losses: scoreboard.losses + 1,
    };
  }

  if (winner === "draw") {
    return {
      ...scoreboard,
      draws: scoreboard.draws + 1,
    };
  }

  return scoreboard;
}

function getStatusText(winner: Winner, isAiThinking: boolean) {
  if (winner === "X") {
    return "You broke the neural grid.";
  }

  if (winner === "O") {
    return "AI wins. The neural grid held.";
  }

  if (winner === "draw") {
    return "Draw. Perfect play reached stalemate.";
  }

  return isAiThinking ? "AI is calculating." : "Your move. Place X.";
}

function playOutcomeSound(winner: Winner, isSoundEnabled: boolean) {
  if (winner === "X") {
    playSound("win", isSoundEnabled);
    return;
  }

  if (winner === "O") {
    playSound("loss", isSoundEnabled);
    return;
  }

  if (winner === "draw") {
    playSound("draw", isSoundEnabled);
  }
}

export default function AiTicTacToePage() {
  const game = getGame("ai-tic-tac-toe");
  const aiTimeoutRef = useRef<number | null>(null);
  const [board, setBoard] = useState<Cell[]>(EMPTY_BOARD);
  const [scoreboard, setScoreboard] = useState<Scoreboard>({
    draws: 0,
    losses: 0,
    wins: 0,
  });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const winner = getWinner(board);
  const winningLine = useMemo(() => getWinningLine(board) ?? [], [board]);
  const winningCells = new Set<number>(winningLine);
  const movesPlayed = board.filter(Boolean).length;

  useEffect(() => {
    const loadStoredSettings = window.setTimeout(() => {
      setIsSoundEnabled(readSoundPreference());
      setUnlockedAchievements(readUnlockedAchievements("ai-tic-tac-toe"));
    }, 0);

    return () => {
      window.clearTimeout(loadStoredSettings);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current !== null) {
        window.clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

  const finishIfNeeded = (nextBoard: Cell[]) => {
    const nextWinner = getWinner(nextBoard);

    if (nextWinner) {
      const completedMatches = incrementAchievementProgress(
        "ai-tic-tac-toe",
        MATCH_PROGRESS_KEY,
      );
      const achievementsToUnlock: AchievementId[] = [];

      if (completedMatches >= 1) {
        achievementsToUnlock.push("first-match");
      }

      if (completedMatches >= 5) {
        achievementsToUnlock.push("persistent-challenger");
      }

      if (nextWinner === "draw") {
        achievementsToUnlock.push("draw-against-ai");
      }

      setUnlockedAchievements(
        unlockAchievements("ai-tic-tac-toe", achievementsToUnlock),
      );
      setScoreboard((current) => updateScoreboard(current, nextWinner));
      playOutcomeSound(nextWinner, isSoundEnabled);
      return true;
    }

    return false;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || isAiThinking) {
      return;
    }

    unlockAudio();
    playSound("move", isSoundEnabled);

    const humanBoard = [...board];
    humanBoard[index] = "X";

    if (finishIfNeeded(humanBoard)) {
      setBoard(humanBoard);
      return;
    }

    setBoard(humanBoard);
    setIsAiThinking(true);

    aiTimeoutRef.current = window.setTimeout(() => {
      setBoard((currentBoard) => {
        if (getWinner(currentBoard)) {
          return currentBoard;
        }

        const aiMove = getBestAiMove(currentBoard);

        if (aiMove === -1) {
          return currentBoard;
        }

        const aiBoard = [...currentBoard];
        aiBoard[aiMove] = "O";
        const aiWinner = getWinner(aiBoard);

        playSound("move", isSoundEnabled);

        if (aiWinner) {
          setScoreboard((current) => updateScoreboard(current, aiWinner));
          playOutcomeSound(aiWinner, isSoundEnabled);
        }

        return aiBoard;
      });
      aiTimeoutRef.current = null;
      setIsAiThinking(false);
    }, 260);
  };

  const restartGame = () => {
    unlockAudio();

    if (aiTimeoutRef.current !== null) {
      window.clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }

    setBoard(EMPTY_BOARD);
    setIsAiThinking(false);
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
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_16%,rgba(251,191,36,0.2),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(244,63,94,0.17),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(34,211,238,0.12),transparent_34%),linear-gradient(135deg,#05060d_0%,#120b12_52%,#08131d_100%)]" />
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
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-200">
            {game.label}
          </p>
          <h1 className="mt-4 text-5xl font-black leading-none tracking-normal sm:text-7xl">
            {game.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
            {game.description}
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                Wins
              </p>
              <p className="mt-1 text-3xl font-black text-white">
                {scoreboard.wins}
              </p>
            </div>
            <div className="rounded-md border border-rose-300/20 bg-rose-300/10 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-rose-100">
                Losses
              </p>
              <p className="mt-1 text-3xl font-black text-white">
                {scoreboard.losses}
              </p>
            </div>
            <div className="rounded-md border border-amber-300/20 bg-amber-300/10 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-100">
                Draws
              </p>
              <p className="mt-1 text-3xl font-black text-white">
                {scoreboard.draws}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={restartGame}
              className="h-12 rounded-md bg-cyan-300 px-6 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-cyan-200"
            >
              Restart Game
            </button>
            <button
              type="button"
              onClick={toggleSound}
              className="h-12 rounded-md border border-white/10 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-amber-200/50 hover:bg-amber-300/10"
            >
              Sound {isSoundEnabled ? "On" : "Off"}
            </button>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-400">
              You are X / AI is O
            </p>
          </div>

          <div className="mt-6 max-w-xl rounded-md border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-400">
                Achievements
              </p>
              <p className="text-xs font-bold text-amber-100">
                {unlockedAchievements.length}/
                {achievementDefinitions["ai-tic-tac-toe"].length}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {achievementDefinitions["ai-tic-tac-toe"].map((achievement) => {
                const isUnlocked = unlockedAchievements.includes(achievement.id);

                return (
                  <div
                    key={achievement.id}
                    className={`rounded-md border px-3 py-3 ${
                      isUnlocked
                        ? "border-amber-300/25 bg-amber-300/10 text-white"
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
          <div className="rounded-md border border-amber-300/20 bg-black/35 p-4 shadow-[inset_0_0_32px_rgba(251,191,36,0.08)] sm:p-5">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-400">
                  Neural Board
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-normal text-white">
                  {getStatusText(winner, isAiThinking)}
                </h2>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.05] px-4 py-3 text-left sm:text-right">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  Moves
                </p>
                <p className="mt-1 text-xl font-black text-white">{movesPlayed}/9</p>
              </div>
            </div>

            <div className="mx-auto grid aspect-square w-full max-w-[520px] grid-cols-3 gap-3">
              {board.map((cell, index) => {
                const isWinningCell = winningCells.has(index);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleCellClick(index)}
                    disabled={Boolean(cell) || Boolean(winner) || isAiThinking}
                    aria-label={`Cell ${index + 1}${cell ? ` occupied by ${cell}` : ""}`}
                    className={`grid aspect-square place-items-center rounded-md border text-5xl font-black tracking-normal transition sm:text-7xl ${
                      isWinningCell
                        ? "border-cyan-200 bg-cyan-300/20 shadow-[0_0_28px_rgba(103,232,249,0.28)]"
                        : "border-white/10 bg-white/[0.045] hover:border-amber-200/60 hover:bg-amber-200/10"
                    } ${cell === "X" ? "text-cyan-200" : "text-rose-200"} disabled:cursor-default`}
                  >
                    {cell}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Human", "X"],
                ["AI", "O"],
                ["Engine", "Minimax"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md border border-white/10 bg-white/[0.035] px-4 py-3"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-zinc-200">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
