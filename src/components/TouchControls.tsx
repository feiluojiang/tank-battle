import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Crosshair } from "lucide-react";
import type { DirId } from "@/game/constants";

interface Props {
  onPress: (idx: number, dir: DirId) => void;
  onRelease: (idx: number, dir: DirId) => void;
  onFire: (idx: number) => void;
  twoPlayer: boolean;
}

function PadButton({
  idx,
  onPress,
  onRelease,
  dir,
  children,
  className,
}: {
  idx: number;
  onPress: Props["onPress"];
  onRelease: Props["onRelease"];
  dir: DirId;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`flex select-none items-center justify-center rounded-md border border-border bg-card/90 text-foreground touch-none active:bg-primary/30 ${className ?? ""}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress(idx, dir);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onRelease(idx, dir);
      }}
      onPointerLeave={() => onRelease(idx, dir)}
      onPointerCancel={() => onRelease(idx, dir)}
    >
      {children}
    </button>
  );
}

function Cluster({
  idx,
  size,
  fire,
  fireOnRight,
  onPress,
  onRelease,
  onFire,
}: {
  idx: number;
  size: number;
  fire: number;
  fireOnRight: boolean;
  onPress: Props["onPress"];
  onRelease: Props["onRelease"];
  onFire: Props["onFire"];
}) {
  const icon = Math.round(size * 0.18);
  return (
    <div
      className="flex items-center gap-1.5"
      style={{ flexDirection: fireOnRight ? "row" : "row-reverse" }}
    >
      <div
        className="grid gap-1"
        style={{
          width: size,
          height: size,
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
        }}
      >
        <PadButton idx={idx} onPress={onPress} onRelease={onRelease} dir={0} className="col-start-2 row-start-1">
          <ChevronUp style={{ width: icon, height: icon }} aria-hidden />
        </PadButton>
        <PadButton idx={idx} onPress={onPress} onRelease={onRelease} dir={3} className="col-start-1 row-start-2">
          <ChevronLeft style={{ width: icon, height: icon }} aria-hidden />
        </PadButton>
        <PadButton idx={idx} onPress={onPress} onRelease={onRelease} dir={2} className="col-start-2 row-start-3">
          <ChevronDown style={{ width: icon, height: icon }} aria-hidden />
        </PadButton>
        <PadButton idx={idx} onPress={onPress} onRelease={onRelease} dir={1} className="col-start-3 row-start-2">
          <ChevronRight style={{ width: icon, height: icon }} aria-hidden />
        </PadButton>
      </div>
      <button
        type="button"
        className="flex select-none items-center justify-center rounded-full border-2 border-primary bg-primary/15 text-primary touch-none active:scale-95"
        style={{ width: fire, height: fire }}
        onPointerDown={(e) => {
          e.preventDefault();
          onFire(idx);
        }}
      >
        <Crosshair style={{ width: Math.round(fire * 0.45), height: Math.round(fire * 0.45) }} aria-hidden />
      </button>
    </div>
  );
}

export function TouchControls({ onPress, onRelease, onFire, twoPlayer }: Props) {
  if (twoPlayer) {
    return (
      <div className="flex w-full items-center justify-between gap-2 md:hidden">
        <Cluster idx={0} size={108} fire={56} fireOnRight onPress={onPress} onRelease={onRelease} onFire={onFire} />
        <Cluster idx={1} size={108} fire={56} fireOnRight={false} onPress={onPress} onRelease={onRelease} onFire={onFire} />
      </div>
    );
  }
  return (
    <div className="flex w-full items-center justify-between gap-4 md:hidden">
      <Cluster idx={0} size={150} fire={80} fireOnRight onPress={onPress} onRelease={onRelease} onFire={onFire} />
    </div>
  );
}
