var BOARD_SIZE = 15;

var TILE_SCORES = {
  A: 1,
  B: 3,
  C: 3,
  D: 2,
  E: 1,
  F: 4,
  G: 2,
  H: 4,
  I: 1,
  J: 8,
  K: 5,
  L: 1,
  M: 3,
  N: 1,
  O: 1,
  P: 3,
  Q: 10,
  R: 1,
  S: 1,
  T: 1,
  U: 1,
  V: 4,
  W: 4,
  X: 8,
  Y: 4,
  Z: 10
};

var MULTS = [
  "  ,  ,  ,TW,  ,  ,TL,  ,TL,  ,  ,TW,  ,  ,  ",
  "  ,  ,DL,  ,  ,DW,  ,  ,  ,DW,  ,  ,DL,  ,  ",
  "  ,DL,  ,  ,DL,  ,  ,  ,  ,  ,DL,  ,  ,DL,  ",
  "TW,  ,  ,TL,  ,  ,  ,DW,  ,  ,  ,TL,  ,  ,TW",
  "  ,  ,DL,  ,  ,  ,DL,  ,DL,  ,  ,  ,DL,  ,  ",
  "  ,DW,  ,  ,  ,TL,  ,  ,  ,TL,  ,  ,  ,DW,  ",
  "TL,  ,  ,  ,DL,  ,  ,  ,  ,  ,DL,  ,  ,  ,TL",
  "  ,  ,  ,DW,  ,  ,  ,  ,  ,  ,  ,DW,  ,  ,  ",
  "TL,  ,  ,  ,DL,  ,  ,  ,  ,  ,DL,  ,  ,  ,TL",
  "  ,DW,  ,  ,  ,TL,  ,  ,  ,TL,  ,  ,  ,DW,  ",
  "  ,  ,DL,  ,  ,  ,DL,  ,DL,  ,  ,  ,DL,  ,  ",
  "TW,  ,  ,TL,  ,  ,  ,DW,  ,  ,  ,TL,  ,  ,TW",
  "  ,DL,  ,  ,DL,  ,  ,  ,  ,  ,DL,  ,  ,DL,  ",
  "  ,  ,DL,  ,  ,DW,  ,  ,  ,DW,  ,  ,DL,  ,  ",
  "  ,  ,  ,TW,  ,  ,TL,  ,TL,  ,  ,TW,  ,  ,  "
];

MULTS = MULTS.map(row => {
  return row.split(",");
});

function getMult(x, y) {
  let val = MULTS[y][x];
  return val === "  " ? null : val;
}

export class Game {
  constructor(str) {
    this.tiles = new Array(BOARD_SIZE);
    for (let i = 0; i < BOARD_SIZE; i++) {
      let row = new Array(BOARD_SIZE);

      for (let j = 0; j < BOARD_SIZE; j++) {
        row[j] = ".";
      }

      this.tiles[i] = row;
    }

    if (typeof str !== "undefined") {
      this.fromString(str);
    }
  }

  getTile(x, y, checkBounds = true) {
    if (x >= BOARD_SIZE || x < 0) {
      if (checkBounds) {
        throw Error(`Overran board boundaries: x = ${x}`);
      } else {
        return null;
      }
    }
    if (y >= BOARD_SIZE || y < 0) {
      if (checkBounds) {
        throw Error(`Overran board boundaries: y = ${y}`);
      } else {
        return null;
      }
    }

    let val = this.tiles[y][x];
    return val == "." ? null : val;
  }

  setTile(x, y, val) {
    this.tiles[y][x] = val;
  }

  fromString(str) {
    let rows = str.split("\n");
    rows = rows.slice(1); // drop first line of string (expect it to be empty)

    if (rows.length !== BOARD_SIZE) {
      throw Error(
        `Incorrect number of rows: expected ${BOARD_SIZE}, got ${rows.length}`
      );
    }

    rows.forEach((row, index) => {
      if (row.length !== BOARD_SIZE) {
        throw Error(
          `Incorrect number of columns: expected ${BOARD_SIZE}, got ${row.length}`
        );
      }

      this.tiles[index] = row.split("");
    });
  }

  toString() {
    let tilesStr = this.tiles
      .map(function(row) {
        return row.join("");
      })
      .join("\n");
    return "Game(`\n" + tilesStr + "`)";
  }

  playTiles(x, y, dir, tiles, onlyScore = false, isScoringPerp = false) {
    // TODO: better error handling - if this dies midway through we'll be sad
    // since some tiles will already have been set

    if (!["r", "d"].includes(dir)) {
      throw Error(`Invalid dir: expected \"r\" or \"d\", got ${dir}`);
    }
    let xOffset = dir == "r" ? 1 : 0;
    let yOffset = dir == "r" ? 0 : 1;

    let isAttached = false;

    let score = 0;
    let perpScores = 0;
    let wordMult = 1;

    // Back up to start of word even if tiles haven't just been placed, so we
    // can add to score
    while (this.getTile(x - xOffset, y - yOffset, false)) {
      x -= xOffset;
      y -= yOffset;
    }

    let scoreExistingTiles = () => {
      while (true) {
        let existingTile = this.getTile(x, y);
        if (!existingTile) {
          break;
        }

        isAttached = true;

        score += TILE_SCORES[existingTile];

        x += xOffset;
        y += yOffset;
      }
    };

    tiles.split("").forEach(tile => {
      scoreExistingTiles();

      let tileScore = TILE_SCORES[tile];

      switch (getMult(x, y)) {
        case "DL":
          tileScore *= 2;
          break;
        case "TL":
          tileScore *= 3;
          break;
        case "DW":
          wordMult *= 2;
          break;
        case "TW":
          wordMult *= 3;
          break;
      }

      score += tileScore;

      // If we're not isScoringPerp, take this tile and get scores for any
      // perpendicular words
      if (!isScoringPerp) {
        let perpScore = this.playTiles(
          x,
          y,
          dir == "r" ? "d" : "r",
          tile,
          true, // Don't place any tiles, only score
          true // Mark this as scoring perp so we don't recurse infinitely
        );

        isAttached = perpScore !== null;
        perpScores += perpScore;
      }

      if (!onlyScore) {
        this.setTile(x, y, tile);
      }

      x += xOffset;
      y += yOffset;
    });

    scoreExistingTiles();

    if (!isAttached) {
      // If this is perpendicular scoring, return null if there aren't any
      // perpendicular tiles to ensure we don't double count the original tile
      // (differentiated from zero, so we can infer isAttached - since two
      // blank tiles next to each other could give a zero scoring perpendicular
      // word)
      if (isScoringPerp) {
        return null;
      }
      // TODO: Error on unattached
    }

    return score * wordMult + perpScores;
  }
}
