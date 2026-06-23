export const games = [
  {
    title: "Cyber Snake",
    slug: "cyber-snake",
    label: "Reflex Grid",
    description:
      "A neon reboot of the classic snake chase, built for fast turns, tight lanes, and escalating speed.",
    accent: "from-emerald-300 via-cyan-300 to-sky-500",
    stat: "Arcade",
  },
  {
    title: "Space Dodger",
    slug: "space-dodger",
    label: "Asteroid Run",
    description:
      "Pilot through drifting debris fields, pulse gates, and close-call scoring zones in deep orbit.",
    accent: "from-fuchsia-300 via-violet-400 to-cyan-400",
    stat: "Action",
  },
  {
    title: "AI Tic-Tac-Toe",
    slug: "ai-tic-tac-toe",
    label: "Neural Duel",
    description:
      "Challenge a tactical AI opponent in a clean, competitive board duel with escalating difficulty.",
    accent: "from-amber-200 via-orange-400 to-rose-500",
    stat: "Strategy",
  },
  {
    title: "2048",
    slug: "2048",
    label: "Tile Fusion",
    description:
      "Slide neon number tiles, chain merges, and build toward the legendary 2048 tile.",
    accent: "from-lime-200 via-emerald-300 to-cyan-400",
    stat: "Puzzle",
  },
] as const;

export type Game = (typeof games)[number];

export function getGame(slug: Game["slug"]) {
  return games.find((game) => game.slug === slug);
}
