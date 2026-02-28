// AUTO-GENERATED — do not edit.
// Run `pnpm generate:autoformat-tests` to regenerate.

import { describe, it, expect } from "vitest";
import { autoformat } from "./autoformat";
import type { Graph } from "./graph/create-graph-api";

function labelX(graph: Graph): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, node] of Object.entries(graph.nodes)) {
    result[id] = node.x;
  }
  return result;
}

describe("autoformat — x-positions", () => {
  it("Basic split: two children stacked in separate rows", () => {
    const initial: Graph = {
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "A"
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 200,
                "y": -80,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "B"
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 140,
                "y": 70,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "C"
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toEqual({
          "A": 0,
          "B": 130,
          "C": 130
    });
  });

  it("Diamond: split children top-aligned at the same x-column", () => {
    const initial: Graph = {
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "A"
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": -40,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "B"
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 140,
                "y": 100,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "C"
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 310,
                "y": 30,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "D"
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toEqual({
          "A": 0,
          "B": 130,
          "C": 130,
          "D": 260
    });
  });

  it("Top-alignment accepted even when it produces a long diagonal edge", () => {
    const initial: Graph = {
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "A"
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 150,
                "y": -30,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "B"
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 300,
                "y": -10,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "C"
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 430,
                "y": 100,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "D"
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 220,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "E"
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toEqual({
          "A": 0,
          "B": 130,
          "C": 260,
          "D": 390,
          "E": 130
    });
  });

  it("Split pulled right to align with downstream merge", () => {
    const initial: Graph = {
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "A"
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 190,
                "y": 50,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "B"
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 330,
                "y": 50,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "C"
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 150,
                "y": 180,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "D"
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 290,
                "y": 170,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "E"
                }
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 410,
                "y": 170,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "F"
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toEqual({
          "A": 0,
          "B": 260,
          "C": 390,
          "D": 130,
          "E": 260,
          "F": 390
    });
  });

  it("Row y depends on available space, not row index", () => {
    const initial: Graph = {
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "A"
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 140
                },
                "state": {
                    "label": "B"
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 90
                },
                "state": {
                    "label": "C"
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 100,
                "y": 220,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "D"
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 280,
                "y": 190,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "E"
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toEqual({
          "A": 0,
          "B": 130,
          "C": 260,
          "D": 130,
          "E": 260
    });
  });

  it("Y placement queries the full x-span across all higher rows", () => {
    const initial: Graph = {
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "A"
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 140
                },
                "state": {
                    "label": "B"
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 270,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 90
                },
                "state": {
                    "label": "C"
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 50,
                "y": 250,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "D"
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 280,
                "y": 190,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "E"
                }
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 180,
                "y": 290,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "F"
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toEqual({
          "A": 0,
          "B": 130,
          "C": 260,
          "D": 130,
          "E": 260,
          "F": 260
    });
  });

  it("Connecting two branches merges them into the same row", () => {
    const initial: Graph = {
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "A"
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 140
                },
                "state": {
                    "label": "B"
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 270,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 90
                },
                "state": {
                    "label": "C"
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 100,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "D"
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 280,
                "y": 190,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "E"
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toEqual({
          "A": 0,
          "B": 130,
          "C": 260,
          "D": 130,
          "E": 260
    });
  });

  it("No pull when merge is in the same row as the split", () => {
    const initial: Graph = {
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "A"
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": -30,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "B"
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 360,
                "y": 80,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "C"
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 110,
                "y": 170,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "D"
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 240,
                "y": 190,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "E"
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toEqual({
          "A": 0,
          "B": 130,
          "C": 390,
          "D": 130,
          "E": 260
    });
  });

  it("Secondary root pulls left to fit chain before shared merge", () => {
    const initial: Graph = {
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "A"
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 280,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "B"
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 30,
                "y": 130,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "C"
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 170,
                "y": 150,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "D"
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toEqual({
          "A": 0,
          "B": 130,
          "C": -130,
          "D": 0
    });
  });

  it("Split pulled toward merge across three branches (longer chains)", () => {
    const initial: Graph = {
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "A"
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 240,
                "y": 70,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "B"
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 380,
                "y": 80,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "C"
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 120,
                "y": 220,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "D"
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 350,
                "y": 210,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "E"
                }
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 70,
                "y": 420,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "F"
                }
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 190,
                "y": 440,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "G"
                }
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 300,
                "y": 440,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "H"
                }
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 420,
                "y": 410,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "I"
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "H",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "H",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toEqual({
          "A": 0,
          "B": 390,
          "C": 520,
          "D": 130,
          "E": 520,
          "F": 130,
          "G": 260,
          "H": 390,
          "I": 520
    });
  });

  it("Large fan-out with cross-row edges and multiple secondary splits", () => {
    const initial: Graph = {
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "A"
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 240,
                "y": 70,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "B"
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 380,
                "y": 80,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "C"
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 120,
                "y": 220,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "D"
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 350,
                "y": 210,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "E"
                }
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 60,
                "y": 350,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "F"
                }
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 170,
                "y": 370,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "G"
                }
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 280,
                "y": 360,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "H"
                }
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 430,
                "y": 340,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "I"
                }
            },
            "J": {
                "id": "J",
                "type": "node",
                "x": 80,
                "y": 520,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "J"
                }
            },
            "K": {
                "id": "K",
                "type": "node",
                "x": 230,
                "y": 490,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "K"
                }
            },
            "L": {
                "id": "L",
                "type": "node",
                "x": 360,
                "y": 510,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "L"
                }
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 510,
                "y": 500,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "M"
                }
            },
            "N": {
                "id": "N",
                "type": "node",
                "x": 640,
                "y": 480,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {
                    "label": "N"
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "H",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "H",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "J",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "J",
                    "port": "out"
                },
                "input": {
                    "node": "K",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "K",
                    "port": "out"
                },
                "input": {
                    "node": "L",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "L",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "N",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "M",
                    "port": "out"
                },
                "input": {
                    "node": "N",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toEqual({
          "A": 0,
          "B": 520,
          "C": 780,
          "D": 130,
          "E": 650,
          "F": 130,
          "G": 260,
          "H": 390,
          "I": 650,
          "J": 130,
          "K": 260,
          "L": 390,
          "M": 520,
          "N": 650
    });
  });
});
