"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  achievementDefinitions,
  readUnlockedAchievements,
  type AchievementGame,
} from "@/lib/achievements";
import { games } from "@/lib/games";
import { readSoundPreference } from "@/lib/sound";
import { readGlobalStats, type GlobalStats } from "@/lib/stats";

type ProfileState = {
  globalStats: GlobalStats;
  isSoundEnabled: boolean;
  unlockedAchievements: Record<AchievementGame, string[]>;
};

const initialProfileState: ProfileState = {
  globalStats: {
    favoriteGame: "No plays yet",
    gamePlayCounts: {
      "2048": 0,
      "ai-tic-tac-toe": 0,
      "cyber-snake": 0,
      "space-dodger": 0,
    },
    overallProgressPercentage: 0,
    puzzleBestScore: 0,
    snakeBestScore: 0,
    spaceDodgerBestScore: 0,
    ticTacToeRecord: {
      draws: 0,
      losses: 0,
      wins: 0,
    },
    totalAchievementsUnlocked: 0,
    totalAvailableAchievements: 0,
    totalGamesPlayed: 0,
  },
  isSoundEnabled: true,
  unlockedAchievements: {
    "2048": [],
    "ai-tic-tac-toe": [],
    "cyber-snake": [],
    "space-dodger": [],
  },
};

const gameAccent = {
  "2048": "border-lime-300/25 bg-lime-300/10 text-lime-100",
  "ai-tic-tac-toe": "border-amber-300/25 bg-amber-300/10 text-amber-100",
  "cyber-snake": "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  "space-dodger": "border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-100",
} satisfies Record<AchievementGame, string>;

function loadProfileState(): ProfileState {
  return {
    globalStats: readGlobalStats(),
    isSoundEnabled: readSoundPreference(),
    unlockedAchievements: {
      "2048": readUnlockedAchievements("2048"),
      "ai-tic-tac-toe": readUnlockedAchievements("ai-tic-tac-toe"),
      "cyber-snake": readUnlockedAchievements("cyber-snake"),
      "space-dodger": readUnlockedAchievements("space-dodger"),
    },
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileState>(initialProfileState);
  const totalAchievements = useMemo(
    () =>
      Object.values(profile.unlockedAchievements).reduce(
        (total, achievements) => total + achievements.length,
        0,
      ),
    [profile.unlockedAchievements],
  );
  const totalAvailableAchievements = Object.values(achievementDefinitions).reduce(
    (total, achievements) => total + achievements.length,
    0,
  );
  const globalStatCards = [
    {
      label: "Games Played",
      value: profile.globalStats.totalGamesPlayed,
      className: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    },
    {
      label: "Achievements",
      value: `${profile.globalStats.totalAchievementsUnlocked}/${profile.globalStats.totalAvailableAchievements}`,
      className: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    },
    {
      label: "Progress",
      value: `${profile.globalStats.overallProgressPercentage}%`,
      className: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    },
    {
      label: "Favorite",
      value: profile.globalStats.favoriteGame,
      className: "border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100",
    },
    {
      label: "Snake Best",
      value: profile.globalStats.snakeBestScore,
      className: "border-sky-300/20 bg-sky-300/10 text-sky-100",
    },
    {
      label: "Dodger Best",
      value: profile.globalStats.spaceDodgerBestScore,
      className: "border-violet-300/20 bg-violet-300/10 text-violet-100",
    },
    {
      label: "2048 Best",
      value: profile.globalStats.puzzleBestScore,
      className: "border-lime-300/20 bg-lime-300/10 text-lime-100",
    },
  ];
  const ticTacToeRecordCards = [
    ["Wins", profile.globalStats.ticTacToeRecord.wins],
    ["Losses", profile.globalStats.ticTacToeRecord.losses],
    ["Draws", profile.globalStats.ticTacToeRecord.draws],
  ] as const;

  useEffect(() => {
    const loadStoredProfile = window.setTimeout(() => {
      setProfile(loadProfileState());
    }, 0);

    return () => {
      window.clearTimeout(loadStoredProfile);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060d] px-6 py-6 text-white sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.2),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(244,114,182,0.16),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(251,191,36,0.12),transparent_34%),linear-gradient(135deg,#05060d_0%,#080a16_52%,#100814_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />

      <header className="mx-auto flex max-w-7xl items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.26em] text-zinc-200">
          Arcade Hub
        </Link>
        <Link
          href="/#games"
          className="rounded-md border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-200 transition hover:border-cyan-200/50 hover:text-cyan-100"
        >
          Games
        </Link>
      </header>

      <section className="mx-auto max-w-7xl py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200">
              Player profile
            </p>
            <h1 className="mt-4 text-5xl font-black leading-none tracking-normal sm:text-7xl">
              Arcade Pilot
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Your local Arcade Hub snapshot: best runs, unlocked achievements,
              and quick access back into every live game.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-5 py-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-100">
                Achievements
              </p>
              <p className="mt-2 text-4xl font-black">
                {totalAchievements}/{totalAvailableAchievements}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-5 py-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-100">
                Snake Best
              </p>
              <p className="mt-2 text-4xl font-black">
                {profile.globalStats.snakeBestScore}
              </p>
            </div>
            <div className="rounded-lg border border-fuchsia-300/20 bg-fuchsia-300/10 px-5 py-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-fuchsia-100">
                Dodger Best
              </p>
              <p className="mt-2 text-4xl font-black">
                {profile.globalStats.spaceDodgerBestScore}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/25">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-400">
                Global Stats
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-normal">
                Arcade-wide progress
              </h2>
            </div>
            <p className="text-sm text-zinc-400">
              Stored locally in this browser.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
            {globalStatCards.map((stat) => (
              <div
                key={stat.label}
                className={`flex min-h-24 flex-col justify-between rounded-md border px-4 py-3 ${stat.className}`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em]">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-black leading-tight text-white tabular-nums">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr]">
            <div className="rounded-md border border-white/10 bg-black/20 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Play Counts
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {games.map((game) => (
                  <div
                    key={game.slug}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <p className="text-xs font-bold text-zinc-400">
                      {game.title}
                    </p>
                    <p className="mt-1 text-xl font-black tabular-nums">
                      {profile.globalStats.gamePlayCounts[game.slug]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-white/10 bg-black/20 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Tic-Tac-Toe Record
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {ticTacToeRecordCards.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <p className="text-xs font-bold text-zinc-400">{label}</p>
                    <p className="mt-1 text-xl font-black tabular-nums">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/25">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-400">
              Profile status
            </p>
            <div className="mt-5 space-y-3">
              <div className="rounded-md border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-sm text-zinc-400">Sound Preference</p>
                <p className="mt-1 text-xl font-black">
                  {profile.isSoundEnabled ? "Sound On" : "Sound Off"}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-sm text-zinc-400">Storage</p>
                <p className="mt-1 text-xl font-black">Local Browser</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-400">
                Quick links
              </p>
              <div className="mt-3 grid gap-3">
                {games.map((game) => (
                  <Link
                    key={game.slug}
                    href={`/games/${game.slug}`}
                    className="rounded-md border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-zinc-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/10"
                  >
                    Play {game.title}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/25">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-400">
                  Achievement archive
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-normal">
                  Progress by game
                </h2>
              </div>
              <p className="text-sm text-zinc-400">
                Locked achievements stay muted until unlocked in-game.
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              {games.map((game) => {
                const gameKey = game.slug as AchievementGame;
                const unlocked = profile.unlockedAchievements[gameKey];

                return (
                  <div
                    key={game.slug}
                    className="rounded-md border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xl font-black">{game.title}</p>
                        <p className="mt-1 text-sm text-zinc-400">{game.label}</p>
                      </div>
                      <span className={`rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${gameAccent[gameKey]}`}>
                        {unlocked.length}/{achievementDefinitions[gameKey].length}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-3">
                      {achievementDefinitions[gameKey].map((achievement) => {
                        const isUnlocked = unlocked.includes(achievement.id);

                        return (
                          <div
                            key={achievement.id}
                            className={`rounded-md border px-3 py-3 ${
                              isUnlocked
                                ? `${gameAccent[gameKey]} text-white`
                                : "border-white/10 bg-white/[0.025] text-zinc-500"
                            }`}
                          >
                            <p className="text-sm font-black">
                              {achievement.title}
                            </p>
                            <p className="mt-1 text-xs leading-5">
                              {achievement.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
