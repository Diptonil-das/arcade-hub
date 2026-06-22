import { GamePlaceholder } from "../GamePlaceholder";
import { getGame } from "@/lib/games";

export default function CyberSnakePage() {
  const game = getGame("cyber-snake");

  if (!game) {
    return null;
  }

  return <GamePlaceholder game={game} />;
}
