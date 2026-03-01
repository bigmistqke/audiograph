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
});
