import Link from "next/link";
import type { Game } from "@/lib/games";

type GamePlaceholderProps = {
  game: Game;
};

export function GamePlaceholder({ game }: GamePlaceholderProps) {
  return (
    <main className="min-h-screen bg-[#05060d] px-6 py-6 text-white sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.2),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(244,114,182,0.16),transparent_28%),linear-gradient(135deg,#05060d_0%,#0a0c18_55%,#110812_100%)]" />
      <header className="mx-auto flex max-w-6xl items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.26em] text-zinc-200">
          Arcade Hub
        </Link>
        <Link
          href="/#games"
          className="rounded-md border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-200 transition hover:border-cyan-200/50 hover:text-cyan-100"
        >
          Back
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 py-16 md:min-h-[calc(100vh-96px)] md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200">
            {game.label}
          </p>
          <h1 className="mt-4 text-5xl font-black leading-none tracking-normal sm:text-7xl">
            {game.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
            {game.description}
          </p>
          <div className="mt-8 inline-flex rounded-md border border-amber-200/25 bg-amber-200/10 px-4 py-3 font-mono text-xs uppercase tracking-[0.22em] text-amber-100">
            Game build pending
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40">
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.accent}`} />
          <div className="rounded-md border border-white/10 bg-black/35 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-400">
                Preview bay
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-bold text-zinc-200">
                {game.stat}
              </span>
            </div>
            <div className="grid aspect-[4/3] grid-cols-8 gap-2">
              {Array.from({ length: 64 }).map((_, index) => (
                <span
                  key={index}
                  className={`rounded-sm border border-white/5 bg-white/[0.035] ${
                    index % 9 === 0 || index % 13 === 0
                      ? `bg-gradient-to-br ${game.accent} shadow-[0_0_22px_rgba(34,211,238,0.25)]`
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Prototype", "Controls", "Leaderboard"].map((item) => (
              <div
                key={item}
                className="rounded-md border border-white/10 bg-white/[0.035] px-4 py-3"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Module
                </p>
                <p className="mt-1 text-sm font-bold text-zinc-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
