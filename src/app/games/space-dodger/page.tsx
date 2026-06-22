import { GamePlaceholder } from "../GamePlaceholder";
import { getGame } from "@/lib/games";

export default function SpaceDodgerPage() {
  const game = getGame("space-dodger");

  if (!game) {
    return null;
  }

  return <GamePlaceholder game={game} />;
}
