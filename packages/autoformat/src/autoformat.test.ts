// AUTO-GENERATED — do not edit.
// Run `pnpm generate:tests` to regenerate.

import { describe, it, expect } from "vitest";
import { autoformat } from ".";
import type { Nodes, Edges } from "@audiograph/create-graph";

interface Graph {
  nodes: Nodes;
  edges: Edges;
}

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
        "edges": {
            "60d65820-f4b4-4dd8-ae5e-a3881a58cb4c": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "71226ede-04b3-4b32-bb24-39a438614e61": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 200,
                "y": -80,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 140,
                "y": 100,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": 130
    });
  });

  it("Diamond: split children top-aligned at the same x-column", () => {
    const initial: Graph = {
        "edges": {
            "A:out->C:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->D:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": -40,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 140,
                "y": 100,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 310,
                "y": 30,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->E:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "E:out->D:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 150,
                "y": -30,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 300,
                "y": -10,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 430,
                "y": 100,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 220,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "E:out->C:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "B:out->F:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 230,
                "y": 30,
                "width": 100,
                "height": 100,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 440,
                "y": 20,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 120,
                "y": 180,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 260,
                "y": 180,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 410,
                "y": 170,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "width": 100,
                "height": 140,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 20,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 100,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 280,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "width": 100,
                "height": 140,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 20,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 140,
                "y": 290,
                "width": 150,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 280,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "D:out->F:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "width": 100,
                "height": 140,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 270,
                "y": 20,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 50,
                "y": 250,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 280,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 180,
                "y": 290,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "width": 100,
                "height": 140,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 270,
                "y": 20,
                "width": 100,
                "height": 90,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 100,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 280,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "E:out->C:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": -30,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 360,
                "y": 80,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 110,
                "y": 170,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 240,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "D:out->B:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 280,
                "y": 20,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 30,
                "y": 130,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 170,
                "y": 150,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "E:out->C:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "A:out->F:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "F:out->G:in": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "G:out->H:in": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "H",
                    "port": "in"
                }
            },
            "H:out->I:in": {
                "output": {
                    "node": "H",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            "B:out->I:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 240,
                "y": 70,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 500,
                "y": 80,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 120,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 350,
                "y": 210,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 70,
                "y": 420,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 190,
                "y": 440,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 300,
                "y": 440,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 420,
                "y": 410,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "E:out->C:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "A:out->F:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "F:out->G:in": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "G:out->H:in": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "H",
                    "port": "in"
                }
            },
            "H:out->I:in": {
                "output": {
                    "node": "H",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            "B:out->I:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            "A:out->J:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "J",
                    "port": "in"
                }
            },
            "J:out->K:in": {
                "output": {
                    "node": "J",
                    "port": "out"
                },
                "input": {
                    "node": "K",
                    "port": "in"
                }
            },
            "K:out->L:in": {
                "output": {
                    "node": "K",
                    "port": "out"
                },
                "input": {
                    "node": "L",
                    "port": "in"
                }
            },
            "L:out->M:in": {
                "output": {
                    "node": "L",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "B:out->N:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "N",
                    "port": "in"
                }
            },
            "M:out->N:in": {
                "output": {
                    "node": "M",
                    "port": "out"
                },
                "input": {
                    "node": "N",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 240,
                "y": 70,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 510,
                "y": 70,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 120,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 350,
                "y": 210,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 60,
                "y": 350,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 170,
                "y": 370,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 280,
                "y": 360,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 430,
                "y": 340,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "J": {
                "id": "J",
                "type": "node",
                "x": 80,
                "y": 520,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "K": {
                "id": "K",
                "type": "node",
                "x": 230,
                "y": 490,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "L": {
                "id": "L",
                "type": "node",
                "x": 360,
                "y": 510,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 510,
                "y": 500,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "N": {
                "id": "N",
                "type": "node",
                "x": 640,
                "y": 480,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "E:out->G:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "F:out->G:in": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "G:out->H:in": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "H",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->I:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            "H:out->I:in": {
                "output": {
                    "node": "H",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 390,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 0,
                "y": 140,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 10,
                "y": 260,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 140,
                "y": 180,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 270,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 520,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "A:out->C:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "B:out->D:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "state": {},
                "width": 100,
                "height": 80
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 200,
                "y": -20,
                "state": {},
                "width": 100,
                "height": 80
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 80,
                "y": 160,
                "state": {},
                "width": 100,
                "height": 80
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 260,
                "y": 140,
                "state": {},
                "width": 100,
                "height": 80
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 390,
                "y": 80,
                "state": {},
                "width": 100,
                "height": 80
            }
        }
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
        "edges": {
            "A:out->M:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "B:out->M:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "M:out->C:in": {
                "output": {
                    "node": "M",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "M:out->D:in": {
                "output": {
                    "node": "M",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 50,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 300,
                "y": 60,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 450,
                "y": -50,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 450,
                "y": 150,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "R1:out->S1:in": {
                "output": {
                    "node": "R1",
                    "port": "out"
                },
                "input": {
                    "node": "S1",
                    "port": "in"
                }
            },
            "R2:out->M:in": {
                "output": {
                    "node": "R2",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "S1:out->A:in": {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "A",
                    "port": "in"
                }
            },
            "S1:out->B:in": {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "A:out->M:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "R1": {
                "id": "R1",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "R2": {
                "id": "R2",
                "type": "node",
                "x": 50,
                "y": 400,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "S1": {
                "id": "S1",
                "type": "node",
                "x": 300,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "A": {
                "id": "A",
                "type": "node",
                "x": 500,
                "y": -100,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 450,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 700,
                "y": -50,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "R:out->S:in": {
                "output": {
                    "node": "R",
                    "port": "out"
                },
                "input": {
                    "node": "S",
                    "port": "in"
                }
            },
            "S:out->B1:in": {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B1",
                    "port": "in"
                }
            },
            "S:out->B2:in": {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B2",
                    "port": "in"
                }
            },
            "S:out->B3:in": {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B3",
                    "port": "in"
                }
            },
            "S:out->B4:in": {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B4",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "R": {
                "id": "R",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "S": {
                "id": "S",
                "type": "node",
                "x": 200,
                "y": 10,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B1": {
                "id": "B1",
                "type": "node",
                "x": 400,
                "y": -60,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B2": {
                "id": "B2",
                "type": "node",
                "x": 350,
                "y": 80,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B3": {
                "id": "B3",
                "type": "node",
                "x": 420,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B4": {
                "id": "B4",
                "type": "node",
                "x": 380,
                "y": 330,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->M:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "C:out->p:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "p",
                    "port": "in"
                }
            },
            "p:out->q:in": {
                "output": {
                    "node": "p",
                    "port": "out"
                },
                "input": {
                    "node": "q",
                    "port": "in"
                }
            },
            "q:out->L:in": {
                "output": {
                    "node": "q",
                    "port": "out"
                },
                "input": {
                    "node": "L",
                    "port": "in"
                }
            },
            "L:out->M:in": {
                "output": {
                    "node": "L",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "C:out->T:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "T",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 800,
                "y": -30,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 30,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 200,
                "y": 180,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "p": {
                "id": "p",
                "type": "node",
                "x": 350,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "q": {
                "id": "q",
                "type": "node",
                "x": 500,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "L": {
                "id": "L",
                "type": "node",
                "x": 650,
                "y": 185,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "T": {
                "id": "T",
                "type": "node",
                "x": 220,
                "y": 350,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "R:out->S1:in": {
                "output": {
                    "node": "R",
                    "port": "out"
                },
                "input": {
                    "node": "S1",
                    "port": "in"
                }
            },
            "S1:out->S2:in": {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "S2",
                    "port": "in"
                }
            },
            "S1:out->X:in": {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "X",
                    "port": "in"
                }
            },
            "S2:out->S3:in": {
                "output": {
                    "node": "S2",
                    "port": "out"
                },
                "input": {
                    "node": "S3",
                    "port": "in"
                }
            },
            "S2:out->Y:in": {
                "output": {
                    "node": "S2",
                    "port": "out"
                },
                "input": {
                    "node": "Y",
                    "port": "in"
                }
            },
            "S3:out->Z1:in": {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z1",
                    "port": "in"
                }
            },
            "S3:out->Z2:in": {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z2",
                    "port": "in"
                }
            },
            "S3:out->Z3:in": {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z3",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "R": {
                "id": "R",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "S1": {
                "id": "S1",
                "type": "node",
                "x": 180,
                "y": 10,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "S2": {
                "id": "S2",
                "type": "node",
                "x": 350,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "S3": {
                "id": "S3",
                "type": "node",
                "x": 520,
                "y": 5,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "Z1": {
                "id": "Z1",
                "type": "node",
                "x": 700,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "X": {
                "id": "X",
                "type": "node",
                "x": 320,
                "y": 400,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "Y": {
                "id": "Y",
                "type": "node",
                "x": 490,
                "y": 300,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "Z2": {
                "id": "Z2",
                "type": "node",
                "x": 680,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "Z3": {
                "id": "Z3",
                "type": "node",
                "x": 660,
                "y": 400,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 80,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 250,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 400,
                "y": 210,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 80,
          "C": 210,
          "D": 340
    });
  });

  it("Edge from merge to multiple nodes in same chain links to first node", () => {
    const initial: Graph = {
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "A:out->C:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "state": {},
                "width": 100,
                "height": 80
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 170,
                "y": 20,
                "state": {},
                "width": 100,
                "height": 80
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 160,
                "y": 160,
                "state": {},
                "width": 100,
                "height": 80
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 300,
                "y": 170,
                "state": {},
                "width": 100,
                "height": 80
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": 130,
          "D": 260
    });
  });

  it("merge before split should be part of the same row", () => {
    const initial: Graph = {
        "edges": {
            "F:out->D:in": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "E:out->D:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->G:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "A:out->C:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "A:out->G:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "state": {},
                "width": 100,
                "height": 80
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 200,
                "y": 80,
                "state": {},
                "width": 100,
                "height": 80
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 210,
                "y": 220,
                "state": {},
                "width": 100,
                "height": 80
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 100,
                "y": 280,
                "state": {},
                "width": 100,
                "height": 80
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": -40,
                "y": 260,
                "state": {},
                "width": 100,
                "height": 80
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": -40,
                "y": 390,
                "state": {},
                "width": 100,
                "height": 80
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 240,
                "y": 370,
                "state": {},
                "width": 100,
                "height": 80
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": 130,
          "D": 0,
          "E": -130,
          "F": -130,
          "G": 130
    });
  });

  it("row placement is not time-dependent", () => {
    const initial: Graph = {
        "edges": {
            "4d837acf-6779-4cc1-8c0d-c7db8baefece": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "2a4083fb-09f1-4cfd-ae71-512560714da6": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 10,
                "y": 100,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 140,
                "y": 10,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 130
    });
  });

  it("Split → Merge can form a row", () => {
    const initial: Graph = {
        "edges": {
            "11614ce1-2423-4fe2-b88b-cf500e9c224e": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "3a7a7d82-6428-4851-89a5-8633d2e8ad75": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "0662150c-0c6a-4a48-b704-b7dbe5f8b929": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "54b01ece-ae4b-43f9-9ed2-90790859757c": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "2d8d8b17-4ec4-4edb-ac44-69776301c655": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 120,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 20,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 260,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 260,
                "y": 10,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": 0,
          "D": 260,
          "E": 260
    });
  });

  it("Secondary root row ordered by initialY, not discovery order", () => {
    const initial: Graph = {
        "edges": {
            "ca0f3857-8f8e-4164-8638-e24a7c0a94ea": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "f239968c-bd78-4b42-9019-d0b4da0f60e7": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "3b7970ce-5377-4eb2-bf6c-4ab45cf6483f": {
                "output": {
                    "node": "H",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "6f192d43-575b-4745-9131-bc9f9d71920d": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "b1755ee9-4c7a-4f61-a73e-c67c90d3972b": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "5ad4bac3-7eed-48e3-b125-c1ea430c5b7f": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            "b8a800a8-e6d0-44b4-bb42-bcfb812868c0": {
                "output": {
                    "node": "I",
                    "port": "out"
                },
                "input": {
                    "node": "J",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "B": {
                "id": "B",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 140,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 270,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 400,
                "y": 0,
                "width": 100,
                "height": 190,
                "state": {}
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 120,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 280,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "J": {
                "id": "J",
                "type": "node",
                "x": 410,
                "y": 210,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "B": 0,
          "C": 130,
          "E": 130,
          "F": 260,
          "G": 390,
          "H": 130,
          "I": 260,
          "J": 390
    });
  });

  it("Merge-split should also remain gap with negative coordinates", () => {
    const initial: Graph = {
        "edges": {
            "53b5a4dc-58a9-48f9-ad42-32634800ba53": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "f6daac90-ea2e-4316-852e-f86f730c0b46": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "49543b63-5bea-4f74-8606-1e4f7c341642": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "0ee8e051-bd47-41b6-b7cb-47da19b00585": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "b78e35c4-4f73-46f5-8bc5-167256e8f728": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": -10,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": -10,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 120,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 360,
                "y": 0,
                "width": 100,
                "height": 140,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 490,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 490,
                "y": 110,
                "width": 140,
                "height": 130,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": -10,
          "B": -10,
          "C": 120,
          "D": 250,
          "E": 380,
          "F": 380
    });
  });

  it("An island that does not cause overlap after layout should not be moved vertically", () => {
    const initial: Graph = {
        "edges": {
            "fefb3861-712f-40ae-b487-f57a3c90feec": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "d6535f48-41a9-4c80-bfd7-aa1cb45d2a93": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "d5f728bf-3501-4a54-a396-534c2518cdfa": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "df96951c-78c5-43af-8b96-13c4f59fb586": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 0,
                "width": 100,
                "height": 270,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 130,
                "y": 300,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 260,
                "y": 300,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 130,
                "y": 120,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": 260,
          "D": 130,
          "E": 260,
          "F": 130
    });
  });

  it("An island that does not cause overlap after layout should not be moved vertically (part 2)", () => {
    const initial: Graph = {
        "edges": {
            "fefb3861-712f-40ae-b487-f57a3c90feec": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "d6535f48-41a9-4c80-bfd7-aa1cb45d2a93": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "d5f728bf-3501-4a54-a396-534c2518cdfa": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "df96951c-78c5-43af-8b96-13c4f59fb586": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 0,
                "width": 100,
                "height": 270,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 130,
                "y": 300,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 260,
                "y": 300,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 170,
                "y": 120,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": 260,
          "D": 130,
          "E": 260,
          "F": 170
    });
  });

  it("secondary merge going into split with negative coordinates", () => {
    const initial: Graph = {
        "edges": {
            "b60c6eb9-3be4-42c7-b26f-2ae6dc53ba7d": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "beff7dea-2a97-451f-bcd9-c959b1b9b6c3": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "f0362333-e2e2-42b5-80f0-2b40077c02f8": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "fe11ffe6-1005-45ed-b216-13a0fca192d2": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "2ad00aeb-96e5-49af-ba8b-5cef819c0d51": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "6069d510-a8ad-4cdd-9fc5-317f81996426": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 0,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": -260,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": -260,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": -130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": 0,
          "D": 130,
          "E": -260,
          "F": -260,
          "G": -130
    });
  });

  it("secondary merge going into split with only positive coordinates", () => {
    const initial: Graph = {
        "edges": {
            "b60c6eb9-3be4-42c7-b26f-2ae6dc53ba7d": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "beff7dea-2a97-451f-bcd9-c959b1b9b6c3": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "f0362333-e2e2-42b5-80f0-2b40077c02f8": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "fe11ffe6-1005-45ed-b216-13a0fca192d2": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "2ad00aeb-96e5-49af-ba8b-5cef819c0d51": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "6069d510-a8ad-4cdd-9fc5-317f81996426": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 290,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 420,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 290,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 420,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 30,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 30,
                "y": 230,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 160,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 290,
          "B": 420,
          "C": 290,
          "D": 420,
          "E": 30,
          "F": 30,
          "G": 160
    });
  });

  it("The first node of a row decides its order", () => {
    const initial: Graph = {
        "edges": {
            "e28eade4-4240-47ce-a6b5-3d2c4efdcbd8": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "f52ff50e-9f75-4c64-9e07-08ae3afaefbd": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "def93ce9-f0c7-4a13-8910-6506b3a1403b": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "fd32bb37-a564-471a-bb9a-a90b4091abfa": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": -130,
                "y": -40,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": -130,
                "y": 230,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 0,
                "y": 120,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": -130,
          "B": -130,
          "C": 0,
          "D": 0,
          "E": 130
    });
  });

  it("The first node of a row decides its order (part 2)", () => {
    const initial: Graph = {
        "edges": {
            "e28eade4-4240-47ce-a6b5-3d2c4efdcbd8": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "f52ff50e-9f75-4c64-9e07-08ae3afaefbd": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "def93ce9-f0c7-4a13-8910-6506b3a1403b": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "fd32bb37-a564-471a-bb9a-a90b4091abfa": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": -130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": -130,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 0,
                "y": -30,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": -130,
          "B": -130,
          "C": 0,
          "D": 0,
          "E": 130
    });
  });

  it("Negative x-coordinates should not break row assignment", () => {
    const initial: Graph = {
        "edges": {
            "d3c43b92-6b13-48ea-aabb-3ef921bff3dc": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "bb8fc6b4-a08a-4992-984d-04f5eaf4efb9": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "82847116-75a2-4204-aea7-cff5909f13f5": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "380cf782-084b-422c-a137-a984bb36b183": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "438b4695-b892-44fe-8c67-45543da1c649": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "9759777b-46a0-4b0d-8a39-b645a5d9d4f7": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": -130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": -130,
                "y": 320,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 0,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": -70,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 130,
          "C": -130,
          "D": -130,
          "E": 0,
          "F": 130,
          "G": 0
    });
  });

  it("Positive x-coordinates do not break row assignment", () => {
    const initial: Graph = {
        "edges": {
            "d3c43b92-6b13-48ea-aabb-3ef921bff3dc": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "bb8fc6b4-a08a-4992-984d-04f5eaf4efb9": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "82847116-75a2-4204-aea7-cff5909f13f5": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "380cf782-084b-422c-a137-a984bb36b183": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "438b4695-b892-44fe-8c67-45543da1c649": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "9759777b-46a0-4b0d-8a39-b645a5d9d4f7": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 270,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 0,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 0,
                "y": 320,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 260,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 60,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelX(autoformat(initial))).toMatchObject({
          "A": 130,
          "B": 260,
          "C": 0,
          "D": 0,
          "E": 130,
          "F": 260,
          "G": 130
    });
  });
});

describe("autoformat — y-positions", () => {
  it("Basic split: two children stacked in separate rows", () => {
    const initial: Graph = {
        "edges": {
            "60d65820-f4b4-4dd8-ae5e-a3881a58cb4c": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "71226ede-04b3-4b32-bb24-39a438614e61": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 200,
                "y": -80,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 140,
                "y": 100,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110
    });
  });

  it("Diamond: split children top-aligned at the same x-column", () => {
    const initial: Graph = {
        "edges": {
            "A:out->C:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->D:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": -40,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 140,
                "y": 100,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 310,
                "y": 30,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->E:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "E:out->D:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 150,
                "y": -30,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 300,
                "y": -10,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 430,
                "y": 100,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 220,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "E:out->C:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "B:out->F:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 230,
                "y": 30,
                "width": 100,
                "height": 100,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 440,
                "y": 20,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 120,
                "y": 180,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 260,
                "y": 180,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 410,
                "y": 170,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "width": 100,
                "height": 140,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 20,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 100,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 280,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "width": 100,
                "height": 140,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 20,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 140,
                "y": 290,
                "width": 150,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 280,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "D:out->F:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "width": 100,
                "height": 140,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 270,
                "y": 20,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 50,
                "y": 250,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 280,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 180,
                "y": 290,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "width": 100,
                "height": 140,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 270,
                "y": 20,
                "width": 100,
                "height": 90,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 100,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 280,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "E:out->C:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": -30,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 360,
                "y": 80,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 110,
                "y": 170,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 240,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "D:out->B:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 280,
                "y": 20,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 30,
                "y": 130,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 170,
                "y": 150,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "E:out->C:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "A:out->F:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "F:out->G:in": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "G:out->H:in": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "H",
                    "port": "in"
                }
            },
            "H:out->I:in": {
                "output": {
                    "node": "H",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            "B:out->I:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 240,
                "y": 70,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 500,
                "y": 80,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 120,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 350,
                "y": 210,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 70,
                "y": 420,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 190,
                "y": 440,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 300,
                "y": 440,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 420,
                "y": 410,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "B:out->E:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "E:out->C:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "A:out->F:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "F:out->G:in": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "G:out->H:in": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "H",
                    "port": "in"
                }
            },
            "H:out->I:in": {
                "output": {
                    "node": "H",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            "B:out->I:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            "A:out->J:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "J",
                    "port": "in"
                }
            },
            "J:out->K:in": {
                "output": {
                    "node": "J",
                    "port": "out"
                },
                "input": {
                    "node": "K",
                    "port": "in"
                }
            },
            "K:out->L:in": {
                "output": {
                    "node": "K",
                    "port": "out"
                },
                "input": {
                    "node": "L",
                    "port": "in"
                }
            },
            "L:out->M:in": {
                "output": {
                    "node": "L",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "B:out->N:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "N",
                    "port": "in"
                }
            },
            "M:out->N:in": {
                "output": {
                    "node": "M",
                    "port": "out"
                },
                "input": {
                    "node": "N",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 240,
                "y": 70,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 510,
                "y": 70,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 120,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 350,
                "y": 210,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 60,
                "y": 350,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 170,
                "y": 370,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 280,
                "y": 360,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 430,
                "y": 340,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "J": {
                "id": "J",
                "type": "node",
                "x": 80,
                "y": 520,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "K": {
                "id": "K",
                "type": "node",
                "x": 230,
                "y": 490,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "L": {
                "id": "L",
                "type": "node",
                "x": 360,
                "y": 510,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 510,
                "y": 500,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "N": {
                "id": "N",
                "type": "node",
                "x": 640,
                "y": 480,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "E:out->G:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "F:out->G:in": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "G:out->H:in": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "H",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->I:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            "H:out->I:in": {
                "output": {
                    "node": "H",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 390,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 0,
                "y": 140,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 10,
                "y": 260,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 140,
                "y": 180,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 270,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 520,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "A:out->C:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "B:out->D:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->E:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "state": {},
                "width": 100,
                "height": 80
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 200,
                "y": -20,
                "state": {},
                "width": 100,
                "height": 80
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 80,
                "y": 160,
                "state": {},
                "width": 100,
                "height": 80
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 260,
                "y": 140,
                "state": {},
                "width": 100,
                "height": 80
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 390,
                "y": 80,
                "state": {},
                "width": 100,
                "height": 80
            }
        }
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
        "edges": {
            "A:out->M:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "B:out->M:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "M:out->C:in": {
                "output": {
                    "node": "M",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "M:out->D:in": {
                "output": {
                    "node": "M",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 50,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 300,
                "y": 60,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 450,
                "y": -50,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 450,
                "y": 150,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "R1:out->S1:in": {
                "output": {
                    "node": "R1",
                    "port": "out"
                },
                "input": {
                    "node": "S1",
                    "port": "in"
                }
            },
            "R2:out->M:in": {
                "output": {
                    "node": "R2",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "S1:out->A:in": {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "A",
                    "port": "in"
                }
            },
            "S1:out->B:in": {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "A:out->M:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "R1": {
                "id": "R1",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "R2": {
                "id": "R2",
                "type": "node",
                "x": 50,
                "y": 400,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "S1": {
                "id": "S1",
                "type": "node",
                "x": 300,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "A": {
                "id": "A",
                "type": "node",
                "x": 500,
                "y": -100,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 450,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 700,
                "y": -50,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "R:out->S:in": {
                "output": {
                    "node": "R",
                    "port": "out"
                },
                "input": {
                    "node": "S",
                    "port": "in"
                }
            },
            "S:out->B1:in": {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B1",
                    "port": "in"
                }
            },
            "S:out->B2:in": {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B2",
                    "port": "in"
                }
            },
            "S:out->B3:in": {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B3",
                    "port": "in"
                }
            },
            "S:out->B4:in": {
                "output": {
                    "node": "S",
                    "port": "out"
                },
                "input": {
                    "node": "B4",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "R": {
                "id": "R",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "S": {
                "id": "S",
                "type": "node",
                "x": 200,
                "y": 10,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B1": {
                "id": "B1",
                "type": "node",
                "x": 400,
                "y": -60,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B2": {
                "id": "B2",
                "type": "node",
                "x": 350,
                "y": 80,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B3": {
                "id": "B3",
                "type": "node",
                "x": 420,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B4": {
                "id": "B4",
                "type": "node",
                "x": 380,
                "y": 330,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "A:out->M:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "C:out->p:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "p",
                    "port": "in"
                }
            },
            "p:out->q:in": {
                "output": {
                    "node": "p",
                    "port": "out"
                },
                "input": {
                    "node": "q",
                    "port": "in"
                }
            },
            "q:out->L:in": {
                "output": {
                    "node": "q",
                    "port": "out"
                },
                "input": {
                    "node": "L",
                    "port": "in"
                }
            },
            "L:out->M:in": {
                "output": {
                    "node": "L",
                    "port": "out"
                },
                "input": {
                    "node": "M",
                    "port": "in"
                }
            },
            "C:out->T:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "T",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "M": {
                "id": "M",
                "type": "node",
                "x": 800,
                "y": -30,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 30,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 200,
                "y": 180,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "p": {
                "id": "p",
                "type": "node",
                "x": 350,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "q": {
                "id": "q",
                "type": "node",
                "x": 500,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "L": {
                "id": "L",
                "type": "node",
                "x": 650,
                "y": 185,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "T": {
                "id": "T",
                "type": "node",
                "x": 220,
                "y": 350,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "R:out->S1:in": {
                "output": {
                    "node": "R",
                    "port": "out"
                },
                "input": {
                    "node": "S1",
                    "port": "in"
                }
            },
            "S1:out->S2:in": {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "S2",
                    "port": "in"
                }
            },
            "S1:out->X:in": {
                "output": {
                    "node": "S1",
                    "port": "out"
                },
                "input": {
                    "node": "X",
                    "port": "in"
                }
            },
            "S2:out->S3:in": {
                "output": {
                    "node": "S2",
                    "port": "out"
                },
                "input": {
                    "node": "S3",
                    "port": "in"
                }
            },
            "S2:out->Y:in": {
                "output": {
                    "node": "S2",
                    "port": "out"
                },
                "input": {
                    "node": "Y",
                    "port": "in"
                }
            },
            "S3:out->Z1:in": {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z1",
                    "port": "in"
                }
            },
            "S3:out->Z2:in": {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z2",
                    "port": "in"
                }
            },
            "S3:out->Z3:in": {
                "output": {
                    "node": "S3",
                    "port": "out"
                },
                "input": {
                    "node": "Z3",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "R": {
                "id": "R",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "S1": {
                "id": "S1",
                "type": "node",
                "x": 180,
                "y": 10,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "S2": {
                "id": "S2",
                "type": "node",
                "x": 350,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "S3": {
                "id": "S3",
                "type": "node",
                "x": 520,
                "y": 5,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "Z1": {
                "id": "Z1",
                "type": "node",
                "x": 700,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "X": {
                "id": "X",
                "type": "node",
                "x": 320,
                "y": 400,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "Y": {
                "id": "Y",
                "type": "node",
                "x": 490,
                "y": 300,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "Z2": {
                "id": "Z2",
                "type": "node",
                "x": 680,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "Z3": {
                "id": "Z3",
                "type": "node",
                "x": 660,
                "y": 400,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
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
        "edges": {
            "B:out->C:in": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 80,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 250,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 400,
                "y": 210,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 200,
          "C": 200,
          "D": 200
    });
  });

  it("Edge from merge to multiple nodes in same chain links to first node", () => {
    const initial: Graph = {
        "edges": {
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "A:out->D:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "C:out->D:in": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "A:out->C:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "state": {},
                "width": 100,
                "height": 80
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 170,
                "y": 20,
                "state": {},
                "width": 100,
                "height": 80
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 160,
                "y": 160,
                "state": {},
                "width": 100,
                "height": 80
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 300,
                "y": 170,
                "state": {},
                "width": 100,
                "height": 80
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110,
          "D": 110
    });
  });

  it("merge before split should be part of the same row", () => {
    const initial: Graph = {
        "edges": {
            "F:out->D:in": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "E:out->D:in": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "D:out->G:in": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "A:out->C:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "A:out->B:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "A:out->G:in": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "state": {},
                "width": 100,
                "height": 80
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 200,
                "y": 80,
                "state": {},
                "width": 100,
                "height": 80
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 210,
                "y": 220,
                "state": {},
                "width": 100,
                "height": 80
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 100,
                "y": 280,
                "state": {},
                "width": 100,
                "height": 80
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": -40,
                "y": 260,
                "state": {},
                "width": 100,
                "height": 80
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": -40,
                "y": 390,
                "state": {},
                "width": 100,
                "height": 80
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 240,
                "y": 370,
                "state": {},
                "width": 100,
                "height": 80
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110,
          "D": 220,
          "E": 220,
          "F": 330,
          "G": 220
    });
  });

  it("row placement is not time-dependent", () => {
    const initial: Graph = {
        "edges": {
            "4d837acf-6779-4cc1-8c0d-c7db8baefece": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "2a4083fb-09f1-4cfd-ae71-512560714da6": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 10,
                "y": 100,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 140,
                "y": 10,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 110,
          "B": 0,
          "C": 0
    });
  });

  it("Split → Merge can form a row", () => {
    const initial: Graph = {
        "edges": {
            "11614ce1-2423-4fe2-b88b-cf500e9c224e": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "3a7a7d82-6428-4851-89a5-8633d2e8ad75": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "0662150c-0c6a-4a48-b704-b7dbe5f8b929": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "54b01ece-ae4b-43f9-9ed2-90790859757c": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "2d8d8b17-4ec4-4edb-ac44-69776301c655": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 120,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 20,
                "y": 190,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 260,
                "y": 200,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 260,
                "y": 10,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 150,
          "D": 150,
          "E": 0
    });
  });

  it("Secondary root row ordered by initialY, not discovery order", () => {
    const initial: Graph = {
        "edges": {
            "ca0f3857-8f8e-4164-8638-e24a7c0a94ea": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "f239968c-bd78-4b42-9019-d0b4da0f60e7": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "3b7970ce-5377-4eb2-bf6c-4ab45cf6483f": {
                "output": {
                    "node": "H",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "6f192d43-575b-4745-9131-bc9f9d71920d": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "b1755ee9-4c7a-4f61-a73e-c67c90d3972b": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "5ad4bac3-7eed-48e3-b125-c1ea430c5b7f": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "I",
                    "port": "in"
                }
            },
            "b8a800a8-e6d0-44b4-bb42-bcfb812868c0": {
                "output": {
                    "node": "I",
                    "port": "out"
                },
                "input": {
                    "node": "J",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "B": {
                "id": "B",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 140,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 270,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 400,
                "y": 0,
                "width": 100,
                "height": 190,
                "state": {}
            },
            "H": {
                "id": "H",
                "type": "node",
                "x": 120,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "I": {
                "id": "I",
                "type": "node",
                "x": 280,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "J": {
                "id": "J",
                "type": "node",
                "x": 410,
                "y": 210,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "B": 0,
          "C": 0,
          "E": 220,
          "F": 0,
          "G": 0,
          "H": 110,
          "I": 220,
          "J": 220
    });
  });

  it("Merge-split should also remain gap with negative coordinates", () => {
    const initial: Graph = {
        "edges": {
            "53b5a4dc-58a9-48f9-ad42-32634800ba53": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "f6daac90-ea2e-4316-852e-f86f730c0b46": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "49543b63-5bea-4f74-8606-1e4f7c341642": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "0ee8e051-bd47-41b6-b7cb-47da19b00585": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "b78e35c4-4f73-46f5-8bc5-167256e8f728": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": -10,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": -10,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 120,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 360,
                "y": 0,
                "width": 100,
                "height": 140,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 490,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 490,
                "y": 110,
                "width": 140,
                "height": 130,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 110,
          "C": 0,
          "D": 0,
          "E": 0,
          "F": 110
    });
  });

  it("An island that does not cause overlap after layout should not be moved vertically", () => {
    const initial: Graph = {
        "edges": {
            "fefb3861-712f-40ae-b487-f57a3c90feec": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "d6535f48-41a9-4c80-bfd7-aa1cb45d2a93": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "d5f728bf-3501-4a54-a396-534c2518cdfa": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "df96951c-78c5-43af-8b96-13c4f59fb586": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 0,
                "width": 100,
                "height": 270,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 130,
                "y": 300,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 260,
                "y": 300,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 130,
                "y": 120,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 300,
          "E": 300,
          "F": 120
    });
  });

  it("An island that does not cause overlap after layout should not be moved vertically (part 2)", () => {
    const initial: Graph = {
        "edges": {
            "fefb3861-712f-40ae-b487-f57a3c90feec": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "d6535f48-41a9-4c80-bfd7-aa1cb45d2a93": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "d5f728bf-3501-4a54-a396-534c2518cdfa": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "df96951c-78c5-43af-8b96-13c4f59fb586": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 260,
                "y": 0,
                "width": 100,
                "height": 270,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 130,
                "y": 300,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 260,
                "y": 300,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 170,
                "y": 120,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 0,
          "D": 300,
          "E": 300,
          "F": 410
    });
  });

  it("secondary merge going into split with negative coordinates", () => {
    const initial: Graph = {
        "edges": {
            "b60c6eb9-3be4-42c7-b26f-2ae6dc53ba7d": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "beff7dea-2a97-451f-bcd9-c959b1b9b6c3": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "f0362333-e2e2-42b5-80f0-2b40077c02f8": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "fe11ffe6-1005-45ed-b216-13a0fca192d2": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "2ad00aeb-96e5-49af-ba8b-5cef819c0d51": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "6069d510-a8ad-4cdd-9fc5-317f81996426": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 0,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": -260,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": -260,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": -130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110,
          "D": 110,
          "E": 110,
          "F": 220,
          "G": 110
    });
  });

  it("secondary merge going into split with only positive coordinates", () => {
    const initial: Graph = {
        "edges": {
            "b60c6eb9-3be4-42c7-b26f-2ae6dc53ba7d": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "beff7dea-2a97-451f-bcd9-c959b1b9b6c3": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "f0362333-e2e2-42b5-80f0-2b40077c02f8": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "D",
                    "port": "in"
                }
            },
            "fe11ffe6-1005-45ed-b216-13a0fca192d2": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "2ad00aeb-96e5-49af-ba8b-5cef819c0d51": {
                "output": {
                    "node": "F",
                    "port": "out"
                },
                "input": {
                    "node": "G",
                    "port": "in"
                }
            },
            "6069d510-a8ad-4cdd-9fc5-317f81996426": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 290,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 420,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 290,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 420,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 30,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 30,
                "y": 230,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 160,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110,
          "D": 110,
          "E": 110,
          "F": 220,
          "G": 110
    });
  });

  it("The first node of a row decides its order", () => {
    const initial: Graph = {
        "edges": {
            "e28eade4-4240-47ce-a6b5-3d2c4efdcbd8": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "f52ff50e-9f75-4c64-9e07-08ae3afaefbd": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "def93ce9-f0c7-4a13-8910-6506b3a1403b": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "fd32bb37-a564-471a-bb9a-a90b4091abfa": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": -130,
                "y": -40,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": -130,
                "y": 230,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 0,
                "y": 120,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": -40,
          "B": 70,
          "C": -40,
          "D": 70,
          "E": -40
    });
  });

  it("The first node of a row decides its order (part 2)", () => {
    const initial: Graph = {
        "edges": {
            "e28eade4-4240-47ce-a6b5-3d2c4efdcbd8": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "f52ff50e-9f75-4c64-9e07-08ae3afaefbd": {
                "output": {
                    "node": "B",
                    "port": "out"
                },
                "input": {
                    "node": "C",
                    "port": "in"
                }
            },
            "def93ce9-f0c7-4a13-8910-6506b3a1403b": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "fd32bb37-a564-471a-bb9a-a90b4091abfa": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": -130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": -130,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 0,
                "y": -30,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 110,
          "B": 220,
          "C": 110,
          "D": 0,
          "E": 0
    });
  });

  it("Negative x-coordinates should not break row assignment", () => {
    const initial: Graph = {
        "edges": {
            "d3c43b92-6b13-48ea-aabb-3ef921bff3dc": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "bb8fc6b4-a08a-4992-984d-04f5eaf4efb9": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "82847116-75a2-4204-aea7-cff5909f13f5": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "380cf782-084b-422c-a137-a984bb36b183": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "438b4695-b892-44fe-8c67-45543da1c649": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "9759777b-46a0-4b0d-8a39-b645a5d9d4f7": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 0,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 140,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": -130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": -130,
                "y": 320,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 0,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": -70,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110,
          "D": 220,
          "E": 110,
          "F": 110,
          "G": 220
    });
  });

  it("Positive x-coordinates do not break row assignment", () => {
    const initial: Graph = {
        "edges": {
            "d3c43b92-6b13-48ea-aabb-3ef921bff3dc": {
                "output": {
                    "node": "A",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "bb8fc6b4-a08a-4992-984d-04f5eaf4efb9": {
                "output": {
                    "node": "C",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "82847116-75a2-4204-aea7-cff5909f13f5": {
                "output": {
                    "node": "D",
                    "port": "out"
                },
                "input": {
                    "node": "E",
                    "port": "in"
                }
            },
            "380cf782-084b-422c-a137-a984bb36b183": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            },
            "438b4695-b892-44fe-8c67-45543da1c649": {
                "output": {
                    "node": "E",
                    "port": "out"
                },
                "input": {
                    "node": "F",
                    "port": "in"
                }
            },
            "9759777b-46a0-4b0d-8a39-b645a5d9d4f7": {
                "output": {
                    "node": "G",
                    "port": "out"
                },
                "input": {
                    "node": "B",
                    "port": "in"
                }
            }
        },
        "nodes": {
            "A": {
                "id": "A",
                "type": "node",
                "x": 130,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "B": {
                "id": "B",
                "type": "node",
                "x": 270,
                "y": 0,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "C": {
                "id": "C",
                "type": "node",
                "x": 0,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "D": {
                "id": "D",
                "type": "node",
                "x": 0,
                "y": 320,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "E": {
                "id": "E",
                "type": "node",
                "x": 130,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "F": {
                "id": "F",
                "type": "node",
                "x": 260,
                "y": 110,
                "width": 100,
                "height": 80,
                "state": {}
            },
            "G": {
                "id": "G",
                "type": "node",
                "x": 60,
                "y": 220,
                "width": 100,
                "height": 80,
                "state": {}
            }
        }
    };
    expect(labelY(autoformat(initial))).toMatchObject({
          "A": 0,
          "B": 0,
          "C": 110,
          "D": 220,
          "E": 110,
          "F": 110,
          "G": 220
    });
  });
});
