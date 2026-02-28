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

function labelY(graph: Graph): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, node] of Object.entries(graph.nodes)) {
    result[id] = node.y;
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
    expect(labelX(autoformat(initial))).toMatchObject({
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
    expect(labelX(autoformat(initial))).toMatchObject({
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
    expect(labelX(autoformat(initial))).toMatchObject({
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
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 230,
                "y": 30,
                "dimensions": {
                    "x": 100,
                    "y": 100
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 440,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 120,
                "y": 180,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 260,
                "y": 180,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
    expect(labelX(autoformat(initial))).toMatchObject({
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
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": 260,
          "D": 130,
          "E": 260
    });
  });

  it("Row y depends on available space, not row index (part 2)", () => {
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
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 140,
                "y": 290,
                "dimensions": {
                    "x": 150,
                    "y": 80
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
    expect(labelX(autoformat(initial))).toMatchObject({
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
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 270,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
    expect(labelX(autoformat(initial))).toMatchObject({
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
    expect(labelX(autoformat(initial))).toMatchObject({
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
    expect(labelX(autoformat(initial))).toMatchObject({
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
    expect(labelX(autoformat(initial))).toMatchObject({
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
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 500,
                "y": 80,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 390,
          "C": 650,
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
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 510,
                "y": 70,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
    expect(labelX(autoformat(initial))).toMatchObject({
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

  it("Rule 3 test case", () => {
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
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 390,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 0,
                "y": 140,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 10,
                "y": 260,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 140,
                "y": 180,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 270,
                "y": 190,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 520,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "G",
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
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "I",
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
            }
        ]
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": 260,
          "D": 390,
          "E": 130,
          "F": 130,
          "G": 260,
          "H": 390,
          "I": 520
    });
  });

  it("multiple chains on the same row ([A]-C-D and D-E)", () => {
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
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 200,
                "y": -20,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 80,
                "y": 160,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 260,
                "y": 140,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 390,
                "y": 80,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
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
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": 130,
          "D": 260,
          "E": 390
    });
  });

  it("Merge-split node (2 inputs, 2 outputs)", () => {
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
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 50,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 300,
                "y": 60,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 450,
                "y": -50,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 450,
                "y": 150,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
                    "node": "M",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "M",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "M",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "M": 130,
          "C": 260,
          "D": 260
    });
  });

  it("Merge row reassignment: high-priority chain lowers merge row", () => {
    const initial: Graph = {
        "nodes": {
            "R1": {
                "id": "R1",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "R2": {
                "id": "R2",
                "type": "node",
                "x": 50,
                "y": 400,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "S1": {
                "id": "S1",
                "type": "node",
                "x": 300,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "A": {
                "id": "A",
                "type": "node",
                "x": 500,
                "y": -100,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 450,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 700,
                "y": -50,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "R1",
                    "port": "out"
                },
                "input": {
                    "node": "S1",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "R2",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "A",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S1",
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
                    "node": "M",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "R1": 0,
          "R2": 260,
          "S1": 130,
          "A": 260,
          "B": 260,
          "M": 390
    });
  });

  it("Four branches from a single split (row ordering with 4 leaves)", () => {
    const initial: Graph = {
        "nodes": {
            "R": {
                "id": "R",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "S": {
                "id": "S",
                "type": "node",
                "x": 200,
                "y": 10,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B1": {
                "id": "B1",
                "type": "node",
                "x": 400,
                "y": -60,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B2": {
                "id": "B2",
                "type": "node",
                "x": 350,
                "y": 80,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B3": {
                "id": "B3",
                "type": "node",
                "x": 420,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B4": {
                "id": "B4",
                "type": "node",
                "x": 380,
                "y": 330,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "R",
                    "port": "out"
                },
                "input": {
                    "node": "S",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B1",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B2",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B3",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B4",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "R": 0,
          "S": 130,
          "B1": 260,
          "B2": 260,
          "B3": 260,
          "B4": 260
    });
  });

  it("Rule 3 with 3 internal nodes (last internal identified correctly)", () => {
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
                }
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 800,
                "y": -30,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 30,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 200,
                "y": 180,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "p": {
                "id": "p",
                "type": "node",
                "x": 350,
                "y": 190,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "q": {
                "id": "q",
                "type": "node",
                "x": 500,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "L": {
                "id": "L",
                "type": "node",
                "x": 650,
                "y": 185,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "T": {
                "id": "T",
                "type": "node",
                "x": 220,
                "y": 350,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
                    "node": "p",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "p",
                    "port": "out"
                },
                "input": {
                    "node": "q",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "q",
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
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "T",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "M": 130,
          "B": -520,
          "C": -390,
          "p": -260,
          "q": -130,
          "L": 0,
          "T": -260
    });
  });

  it("Three levels of nested splits (spine propagates through S1→S2→S3)", () => {
    const initial: Graph = {
        "nodes": {
            "R": {
                "id": "R",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "S1": {
                "id": "S1",
                "type": "node",
                "x": 180,
                "y": 10,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "S2": {
                "id": "S2",
                "type": "node",
                "x": 350,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "S3": {
                "id": "S3",
                "type": "node",
                "x": 520,
                "y": 5,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "Z1": {
                "id": "Z1",
                "type": "node",
                "x": 700,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "X": {
                "id": "X",
                "type": "node",
                "x": 320,
                "y": 400,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "Y": {
                "id": "Y",
                "type": "node",
                "x": 490,
                "y": 300,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "Z2": {
                "id": "Z2",
                "type": "node",
                "x": 680,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "Z3": {
                "id": "Z3",
                "type": "node",
                "x": 660,
                "y": 400,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "R",
                    "port": "out"
                },
                "input": {
                    "node": "S1",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "S2",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "X",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S2",
                    "port": "out"
                },
                "input": {
                    "node": "S3",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S2",
                    "port": "out"
                },
                "input": {
                    "node": "Y",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z1",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z2",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z3",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "R": 0,
          "S1": 130,
          "S2": 260,
          "S3": 390,
          "Z1": 520,
          "X": 260,
          "Y": 390,
          "Z2": 520,
          "Z3": 520
    });
  });

  it("Secondary root with no downstream merge keeps node at original position", () => {
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
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 80,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 250,
                "y": 220,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 400,
                "y": 210,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            }
        },
        "edges": [
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
            }
        ]
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 80,
          "C": 210,
          "D": 340
    });
  });

  it("merge with edges to multiple nodes in same chain links to first node of chain", () => {
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
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 150,
                "y": 10,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 100,
                "y": 170,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 270,
                "y": 190,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
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
            }
        ]
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": 130,
          "D": 260
    });
  });
});

describe("autoformat — y-positions", () => {
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110,
          "D": 0
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 0,
          "E": 110
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
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 230,
                "y": 30,
                "dimensions": {
                    "x": 100,
                    "y": 100
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 440,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 120,
                "y": 180,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 260,
                "y": 180,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 130,
          "E": 130,
          "F": 110
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
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 170,
          "E": 110
    });
  });

  it("Row y depends on available space, not row index (part 2)", () => {
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
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 140,
                "y": 290,
                "dimensions": {
                    "x": 150,
                    "y": 80
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 220,
          "E": 110
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
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 270,
                "y": 20,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 220,
          "E": 110,
          "F": 220
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 170,
          "E": 170
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 110,
          "E": 110
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110,
          "D": 110
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
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 500,
                "y": 80,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 110,
          "E": 110,
          "F": 220,
          "G": 220,
          "H": 220,
          "I": 220
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
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 510,
                "y": 70,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 110,
          "E": 110,
          "F": 220,
          "G": 220,
          "H": 220,
          "I": 220,
          "J": 330,
          "K": 330,
          "L": 330,
          "M": 330,
          "N": 330
    });
  });

  it("Rule 3 test case", () => {
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
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 390,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 0,
                "y": 140,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 10,
                "y": 260,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 140,
                "y": 180,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 270,
                "y": 190,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 520,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "G",
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
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "I",
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
            }
        ]
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 0,
          "E": 110,
          "F": 220,
          "G": 110,
          "H": 110,
          "I": 0
    });
  });

  it("multiple chains on the same row ([A]-C-D and D-E)", () => {
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
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 200,
                "y": -20,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 80,
                "y": 160,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 260,
                "y": 140,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 390,
                "y": 80,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
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
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110,
          "D": 0,
          "E": 0
    });
  });

  it("Merge-split node (2 inputs, 2 outputs)", () => {
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
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 50,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 300,
                "y": 60,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 450,
                "y": -50,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 450,
                "y": 150,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
                    "node": "M",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "M",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "M",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 110,
          "M": 0,
          "C": 0,
          "D": 110
    });
  });

  it("Merge row reassignment: high-priority chain lowers merge row", () => {
    const initial: Graph = {
        "nodes": {
            "R1": {
                "id": "R1",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "R2": {
                "id": "R2",
                "type": "node",
                "x": 50,
                "y": 400,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "S1": {
                "id": "S1",
                "type": "node",
                "x": 300,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "A": {
                "id": "A",
                "type": "node",
                "x": 500,
                "y": -100,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 450,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 700,
                "y": -50,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "R1",
                    "port": "out"
                },
                "input": {
                    "node": "S1",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "R2",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "A",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S1",
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
                    "node": "M",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "R1": 0,
          "R2": 220,
          "S1": 0,
          "A": 0,
          "B": 110,
          "M": 0
    });
  });

  it("Four branches from a single split (row ordering with 4 leaves)", () => {
    const initial: Graph = {
        "nodes": {
            "R": {
                "id": "R",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "S": {
                "id": "S",
                "type": "node",
                "x": 200,
                "y": 10,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B1": {
                "id": "B1",
                "type": "node",
                "x": 400,
                "y": -60,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B2": {
                "id": "B2",
                "type": "node",
                "x": 350,
                "y": 80,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B3": {
                "id": "B3",
                "type": "node",
                "x": 420,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B4": {
                "id": "B4",
                "type": "node",
                "x": 380,
                "y": 330,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "R",
                    "port": "out"
                },
                "input": {
                    "node": "S",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B1",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B2",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B3",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B4",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "R": 0,
          "S": 0,
          "B1": 0,
          "B2": 110,
          "B3": 220,
          "B4": 330
    });
  });

  it("Rule 3 with 3 internal nodes (last internal identified correctly)", () => {
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
                }
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 800,
                "y": -30,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 30,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 200,
                "y": 180,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "p": {
                "id": "p",
                "type": "node",
                "x": 350,
                "y": 190,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "q": {
                "id": "q",
                "type": "node",
                "x": 500,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "L": {
                "id": "L",
                "type": "node",
                "x": 650,
                "y": 185,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "T": {
                "id": "T",
                "type": "node",
                "x": 220,
                "y": 350,
                "dimensions": {
                    "x": 100,
                    "y": 80
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
                    "node": "p",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "p",
                    "port": "out"
                },
                "input": {
                    "node": "q",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "q",
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
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "T",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "M": 0,
          "B": 110,
          "C": 110,
          "p": 110,
          "q": 110,
          "L": 110,
          "T": 220
    });
  });

  it("Three levels of nested splits (spine propagates through S1→S2→S3)", () => {
    const initial: Graph = {
        "nodes": {
            "R": {
                "id": "R",
                "type": "node",
                "x": 0,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "S1": {
                "id": "S1",
                "type": "node",
                "x": 180,
                "y": 10,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "S2": {
                "id": "S2",
                "type": "node",
                "x": 350,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "S3": {
                "id": "S3",
                "type": "node",
                "x": 520,
                "y": 5,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "Z1": {
                "id": "Z1",
                "type": "node",
                "x": 700,
                "y": 0,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "X": {
                "id": "X",
                "type": "node",
                "x": 320,
                "y": 400,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "Y": {
                "id": "Y",
                "type": "node",
                "x": 490,
                "y": 300,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "Z2": {
                "id": "Z2",
                "type": "node",
                "x": 680,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "Z3": {
                "id": "Z3",
                "type": "node",
                "x": 660,
                "y": 400,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            }
        },
        "edges": [
            {
                "output": {
                    "node": "R",
                    "port": "out"
                },
                "input": {
                    "node": "S1",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "S2",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "X",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S2",
                    "port": "out"
                },
                "input": {
                    "node": "S3",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S2",
                    "port": "out"
                },
                "input": {
                    "node": "Y",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z1",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z2",
                    "port": "in"
                }
            },
            {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z3",
                    "port": "in"
                }
            }
        ]
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "R": 0,
          "S1": 0,
          "S2": 0,
          "S3": 0,
          "Z1": 0,
          "X": 110,
          "Y": 110,
          "Z2": 110,
          "Z3": 220
    });
  });

  it("Secondary root with no downstream merge keeps node at original position", () => {
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
                }
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 80,
                "y": 200,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 250,
                "y": 220,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 400,
                "y": 210,
                "dimensions": {
                    "x": 100,
                    "y": 80
                }
            }
        },
        "edges": [
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
            }
        ]
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 200,
          "C": 200,
          "D": 200
    });
  });

  it("merge with edges to multiple nodes in same chain links to first node of chain", () => {
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
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 150,
                "y": 10,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 100,
                "y": 170,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 270,
                "y": 190,
                "dimensions": {
                    "x": 100,
                    "y": 80
                },
                "state": {}
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
            }
        ]
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110,
          "D": 110
    });
  });
});
