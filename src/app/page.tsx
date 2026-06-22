import Link from "next/link";
import { games } from "@/lib/games";

const gameDetails = {
  "cyber-snake": {
    difficulty: "Medium",
    type: "Reflex Arcade",
    features: ["Canvas grid chase", "Persistent best score", "Fast arrow turns"],
    previewCells: [7, 8, 9, 15, 21, 22, 30],
  },
  "space-dodger": {
    difficulty: "Hard",
    type: "Survival Action",
    features: ["Falling asteroid field", "Survival score chase", "Precision dodging"],
    previewCells: [4, 10, 17, 23, 29, 35, 42],
  },
  "ai-tic-tac-toe": {
    difficulty: "Expert",
    type: "Strategy Duel",
    features: ["Unbeatable Minimax AI", "Win-line highlights", "Session scoreboard"],
    previewCells: [0, 4, 8, 2, 6, 10, 14],
  },
} satisfies Record<
  (typeof games)[number]["slug"],
  {
    difficulty: string;
    features: string[];
    previewCells: number[];
    type: string;
  }
>;

const portalStats = [
  { label: "Games Live", value: "3" },
  { label: "Browser Playable", value: "100%" },
  { label: "Downloads Required", value: "0" },
];

export default function Home() {
  const featuredGame = games[0];

  return (
    <main className="min-h-screen overflow-hidden bg-[#05060d] text-white">
      <section className="relative isolate px-6 py-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(244,114,182,0.16),transparent_28%),radial-gradient(circle_at_48%_88%,rgba(250,204,21,0.12),transparent_32%),linear-gradient(135deg,#05060d_0%,#080a16_48%,#0d0813_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />

        <header className="mx-auto flex max-w-7xl items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md border border-cyan-300/40 bg-cyan-300/10 font-mono text-sm font-black text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.22)]">
              AH
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-200">
              Arcade Hub
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-300 sm:flex">
            <a className="transition hover:text-cyan-200" href="#featured">
              Featured
            </a>
            <a className="transition hover:text-fuchsia-200" href="#stats">
              Stats
            </a>
            <a className="transition hover:text-amber-100" href="#games">
              Games
            </a>
            <Link className="transition hover:text-emerald-200" href="/profile">
              Profile
            </Link>
          </nav>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-12 pb-12 pt-14 md:grid-cols-[1fr_0.9fr] md:pt-20 lg:gap-20">
          <div>
            <p className="mb-5 inline-flex rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
              Instant browser arcade
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-normal text-white sm:text-7xl lg:text-8xl">
              Arcade Hub
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
              A polished neon portal for quick runs, skill checks, and tactical
              duels. Every game is live in the browser with sharp controls,
              score chasing, and no setup delay.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#featured"
                className="inline-flex h-12 items-center justify-center rounded-md bg-cyan-300 px-6 text-sm font-bold uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-cyan-200"
              >
                Browse Arcade
              </a>
              <Link
                href="/games/cyber-snake"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] px-6 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-fuchsia-300/50 hover:bg-fuchsia-300/10"
              >
                Play Featured
              </Link>
              <Link
                href="/profile"
                className="inline-flex h-12 items-center justify-center rounded-md border border-emerald-300/25 bg-emerald-300/10 px-6 text-sm font-bold uppercase tracking-[0.18em] text-emerald-100 transition hover:border-emerald-200/50 hover:bg-emerald-300/15"
              >
                View Profile
              </Link>
            </div>
          </div>

          <div id="arena" className="relative min-h-[430px]">
            <div className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.04] shadow-2xl shadow-cyan-950/40 backdrop-blur-md" />
            <div className="absolute inset-4 rounded-md border border-cyan-300/20 bg-[#070914]">
              <div className="grid h-full grid-cols-7 grid-rows-7 gap-2 p-5">
                {Array.from({ length: 49 }).map((_, index) => (
                  <div
                    key={index}
                    className={`rounded-sm border border-white/5 bg-white/[0.03] ${
                      [9, 10, 11, 18, 25, 32].includes(index)
                        ? "bg-emerald-300 shadow-[0_0_24px_rgba(110,231,183,0.55)]"
                        : ""
                    } ${
                      [5, 13, 21, 29, 37].includes(index)
                        ? "bg-fuchsia-400 shadow-[0_0_24px_rgba(232,121,249,0.45)]"
                        : ""
                    } ${
                      [34, 35, 36, 43].includes(index)
                        ? "bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.5)]"
                        : ""
                    } ${
                      [2, 24, 46].includes(index)
                        ? "bg-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.42)]"
                        : ""
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="absolute left-8 top-8 rounded-md border border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-200">
                Featured
              </p>
              <p className="mt-1 text-2xl font-black">{featuredGame.title}</p>
            </div>
            <div className="absolute bottom-8 right-8 rounded-md border border-emerald-200/30 bg-emerald-200/10 px-4 py-3 text-right backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-100">
                Status
              </p>
              <p className="mt-1 text-sm font-bold text-white">Now Playable</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="stats"
        className="border-y border-white/10 bg-[#080912] px-6 py-8 sm:px-8 lg:px-12"
      >
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {portalStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-white/10 bg-white/[0.035] px-5 py-5"
            >
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
                {stat.label}
              </p>
              <p className="mt-2 text-4xl font-black tracking-normal text-white">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="featured"
        className="bg-[#05060d] px-6 py-18 sm:px-8 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-fuchsia-200">
                Featured games
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-white sm:text-5xl">
                Pick a run, chase a score
              </h2>
            </div>
            <p className="max-w-xl text-zinc-400">
              Three finished arcade modes cover reflexes, survival, and
              strategy. Each one launches directly from this portal.
            </p>
          </div>

          <div id="games" className="mt-10 grid gap-5 lg:grid-cols-3">
            {games.map((game, index) => {
              const details = gameDetails[game.slug];

              return (
                <article
                  key={game.slug}
                  className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/25 transition hover:-translate-y-1 hover:border-cyan-200/40"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.accent}`} />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-400">
                      0{index + 1} / {details.type}
                    </span>
                    <span className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">
                      Now Playable
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-zinc-200">
                      {game.label}
                    </span>
                    <span className="rounded-md border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-xs font-semibold text-amber-100">
                      {details.difficulty}
                    </span>
                    <span className="rounded-md border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      {game.stat}
                    </span>
                  </div>

                  <div className="mt-7 h-40 rounded-md border border-white/10 bg-black/30 p-4">
                    <div className="grid h-full grid-cols-7 gap-2">
                      {Array.from({ length: 21 }).map((_, cell) => (
                        <span
                          key={cell}
                          className={`rounded-sm border border-white/5 bg-white/[0.04] ${
                            details.previewCells.includes(cell)
                              ? `bg-gradient-to-br ${game.accent} shadow-[0_0_22px_rgba(34,211,238,0.25)]`
                              : ""
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="mt-7 text-2xl font-black tracking-normal text-white">
                    {game.title}
                  </h3>
                  <p className="mt-3 min-h-24 text-sm leading-7 text-zinc-400">
                    {game.description}
                  </p>

                  <ul className="mt-5 space-y-2">
                    {details.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 text-sm text-zinc-300"
                      >
                        <span className="size-2 rounded-sm bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.45)]" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/games/${game.slug}`}
                    className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-md border border-cyan-200/40 bg-cyan-300 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition group-hover:bg-white"
                  >
                    Play Now
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
