import { GamePlaceholder } from "../GamePlaceholder";
import { getGame } from "@/lib/games";

export default function AiTicTacToePage() {
  const game = getGame("ai-tic-tac-toe");

  if (!game) {
    return null;
  }

  return <GamePlaceholder game={game} />;
}
