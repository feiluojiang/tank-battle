import { useState } from "react";
import { Coins, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Overlay } from "@/components/Leaderboard";
import {
  UPGRADE_DEFS,
  buyUpgrade,
  getCredits,
  getUpgrades,
  type Upgrades,
} from "@/game/upgrades";

export function UpgradeShop({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [credits, setCredits] = useState(getCredits());
  const [ups, setUps] = useState<Upgrades>(getUpgrades());
  if (!open) return null;
  const buy = (id: keyof Upgrades) => {
    if (buyUpgrade(id)) {
      setCredits(getCredits());
      setUps(getUpgrades());
    }
  };
  return (
    <Overlay>
      <div className="flex items-center gap-2">
        <Coins className="size-6 text-primary" aria-hidden />
        <p className="text-lg font-bold">强化商店</p>
        <span className="ml-1 rounded bg-primary/15 px-2 py-0.5 text-sm font-semibold text-primary">
          {credits}
        </span>
      </div>
      <div className="flex w-full max-w-[300px] flex-col gap-2">
        {UPGRADE_DEFS.map((d) => {
          const owned = ups[d.id] > 0;
          const afford = credits >= d.cost;
          return (
            <div
              key={d.id}
              className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-left"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{d.label}</p>
                <p className="text-[11px] text-muted-foreground">{d.desc}</p>
              </div>
              <Button
                size="sm"
                variant={owned ? "outline" : "default"}
                disabled={owned || !afford}
                onClick={() => buy(d.id)}
              >
                {owned ? "已购" : `${d.cost}`}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">每局结束自动把得分累计为可用积分</p>
      <Button size="sm" variant="outline" onClick={onClose}>
        <X className="size-4" aria-hidden /> 关闭
      </Button>
    </Overlay>
  );
}
