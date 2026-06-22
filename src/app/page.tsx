import Link from "next/link";
import { games } from "@/lib/games";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#05060d] text-white">
      <section className="relative isolate min-h-[92vh] px-6 py-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(244,114,182,0.18),transparent_28%),radial-gradient(circle_at_50%_85%,rgba(250,204,21,0.13),transparent_32%),linear-gradient(135deg,#05060d_0%,#080a16_48%,#0d0813_100%)]" />
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
            <a className="transition hover:text-cyan-200" href="#games">
              Games
            </a>
            <a className="transition hover:text-fuchsia-200" href="#arena">
              Arena
            </a>
          </nav>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-12 pb-14 pt-16 md:grid-cols-[1fr_0.86fr] md:pt-24 lg:gap-20">
          <div>
            <p className="mb-5 inline-flex rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
              Next-gen browser arcade
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-normal text-white sm:text-7xl lg:text-8xl">
              Arcade Hub
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
              A futuristic gaming portal for fast sessions, sharp visuals, and
              competitive browser games. Pick a title, enter the arena, and get
              ready for the next drop.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#games"
                className="inline-flex h-12 items-center justify-center rounded-md bg-cyan-300 px-6 text-sm font-bold uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-cyan-200"
              >
                Explore Games
              </a>
              <Link
                href="/games/cyber-snake"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] px-6 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-fuchsia-300/50 hover:bg-fuchsia-300/10"
              >
                Start Mission
              </Link>
            </div>
          </div>

          <div id="arena" className="relative min-h-[420px]">
            <div className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.04] shadow-2xl shadow-cyan-950/40 backdrop-blur-md" />
            <div className="absolute inset-4 rounded-md border border-cyan-300/20 bg-[#070914]">
              <div className="grid h-full grid-cols-6 grid-rows-6 gap-2 p-5">
                {Array.from({ length: 36 }).map((_, index) => (
                  <div
                    key={index}
                    className={`rounded-sm border border-white/5 bg-white/[0.03] ${
                      [7, 8, 9, 15, 21].includes(index)
                        ? "bg-emerald-300 shadow-[0_0_24px_rgba(110,231,183,0.55)]"
                        : ""
                    } ${
                      [4, 17, 29].includes(index)
                        ? "bg-fuchsia-400 shadow-[0_0_24px_rgba(232,121,249,0.45)]"
                        : ""
                    } ${
                      [26, 27, 28].includes(index)
                        ? "bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.5)]"
                        : ""
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="absolute left-8 top-8 rounded-md border border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-200">
                Live Queue
              </p>
              <p className="mt-1 text-2xl font-black">03 Games</p>
            </div>
            <div className="absolute bottom-8 right-8 rounded-md border border-amber-200/30 bg-amber-200/10 px-4 py-3 text-right backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-100">
                Status
              </p>
              <p className="mt-1 text-sm font-bold text-white">Launching Soon</p>
            </div>
          </div>
        </div>
      </section>

      <section id="games" className="border-t border-white/10 bg-[#080912] px-6 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-fuchsia-200">
                Game roster
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-white sm:text-5xl">
                Choose your next run
              </h2>
            </div>
            <p className="max-w-xl text-zinc-400">
              Three arcade concepts are staged for launch. Each route is ready
              for gameplay implementation when the mechanics are built.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {games.map((game, index) => (
              <article
                key={game.slug}
                className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/25 transition hover:-translate-y-1 hover:border-cyan-200/40"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.accent}`} />
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-400">
                    0{index + 1} / {game.stat}
                  </span>
                  <span className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">
                    {game.label}
                  </span>
                </div>
                <div className="mt-8 h-36 rounded-md border border-white/10 bg-black/30 p-4">
                  <div className="grid h-full grid-cols-5 gap-2">
                    {Array.from({ length: 15 }).map((_, cell) => (
                      <span
                        key={cell}
                        className={`rounded-sm bg-white/[0.06] ${
                          cell % (index + 3) === 0
                            ? `bg-gradient-to-br ${game.accent}`
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
                <Link
                  href={`/games/${game.slug}`}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md border border-white/10 bg-white text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition group-hover:border-cyan-200 group-hover:bg-cyan-200"
                >
                  Play
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
