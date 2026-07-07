import { COLS, Tile, type TileId } from "./constants";

const LEGEND: Record<string, TileId> = {
  " ": Tile.Empty,
  B: Tile.Brick,
  S: Tile.Steel,
  W: Tile.Water,
  F: Tile.Forest,
  E: Tile.Base,
};

export interface ParsedMap {
  tiles: TileId[][];
}

export const PLAYER_SPAWN: ReadonlyArray<readonly [number, number]> = [
  [4, 12],
  [8, 12],
];

export const ENEMY_SPAWNS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [6, 0],
  [12, 0],
];

const LEVEL_RAW: string[][] = [
  [
    "             ",
    "  BB BBB BB  ",
    "  BB BBB BB  ",
    "  BB     BB  ",
    "  BB SSS BB  ",
    "        S    ",
    " SS BBB SS S ",
    "   B F B     ",
    "   B F B     ",
    "             ",
    " BB BB BB BB ",
    "     BBB     ",
    "     BEB     ",
  ],
  [
    "             ",
    " BBBW   WBBB ",
    " B  W   W  B ",
    " B  SSSSS  B ",
    " B         B ",
    "   FFFFFF    ",
    "   F    F    ",
    "   F    F    ",
    "   F    F    ",
    " B         B ",
    " BB       BB ",
    "     BBB     ",
    "     BEB     ",
  ],
  [
    "             ",
    " B B B B B B ",
    " B B B B B B ",
    "             ",
    " BBBBBBBBBBB ",
    " B         B ",
    " B  WSSSW  B ",
    " B  S F S  B ",
    " B  WSSSW  B ",
    " B         B ",
    " BBBBBBBBBBB ",
    "     BBB     ",
    "     BEB     ",
  ],
  [
    "             ",
    " B B B B B B ",
    " B B B B B B ",
    "             ",
    "  SS     SS  ",
    "  B  W W  B  ",
    "  B  W W  B  ",
    "  B  W W  B  ",
    "  SS     SS  ",
    "             ",
    " B B B B B B ",
    "     BBB     ",
    "     BEB     ",
  ],
  [
    "             ",
    " BBBBBBBBBBB ",
    " B         B ",
    " B SSS SSS B ",
    " B S     S B ",
    " B S FFF S B ",
    " B S FFF S B ",
    " B S FFF S B ",
    " B S     S B ",
    " B SSS SSS B ",
    " B         B ",
    "     BBB     ",
    "     BEB     ",
  ],
  [
    "             ",
    "             ",
    " BBBB   BBBB ",
    "             ",
    "  F   SS   F ",
    "  F   SS   F ",
    "             ",
    " BBBB   BBBB ",
    "             ",
    " W W     W W ",
    "             ",
    "     BBB     ",
    "     BEB     ",
  ],
];

function parse(raw: string[]): ParsedMap {
  const tiles: TileId[][] = [];
  for (let r = 0; r < raw.length; r++) {
    const row: TileId[] = [];
    const line = raw[r];
    for (let c = 0; c < COLS; c++) {
      row.push(LEGEND[line[c]] ?? Tile.Empty);
    }
    tiles.push(row);
  }
  return { tiles };
}

export const LEVELS: ParsedMap[] = LEVEL_RAW.map(parse);

export function levelFor(index: number): ParsedMap {
  return LEVELS[index % LEVELS.length];
}
