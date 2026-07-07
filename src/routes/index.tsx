import { createFileRoute } from "@tanstack/react-router";
import { GameCanvas } from "@/components/GameCanvas";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <GameCanvas />;
}
