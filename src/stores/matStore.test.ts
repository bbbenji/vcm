import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMatStore } from "./matStore";
import { templates } from "../utils/templates";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function installBrowserStubs(hash = "") {
  const location = {
    pathname: "/",
    search: "",
    hash,
  };

  const replaceState = vi.fn((_state: unknown, _title: string, url?: string | URL | null) => {
    if (url == null) return;

    const nextUrl = String(url);
    const hashIndex = nextUrl.indexOf("#");
    location.hash = hashIndex === -1 ? "" : nextUrl.slice(hashIndex);
  });

  vi.stubGlobal("localStorage", new MemoryStorage());
  vi.stubGlobal("window", {
    location,
    history: { replaceState },
  });
  vi.stubGlobal("document", {
    documentElement: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    },
  });
}

function templateById(id: string) {
  const template = templates.find((item) => item.id === id);
  if (!template) throw new Error(`Missing test template: ${id}`);
  return template;
}

describe("matStore undo history", () => {
  beforeEach(() => {
    installBrowserStubs();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records a single undo point when loading a template", () => {
    const store = useMatStore();
    const template = templateById("heart");
    const previousCell = store.gridData[0]?.[0];

    if (!previousCell) throw new Error("Expected initialized grid");
    previousCell.bg = "#3b82f6";
    store.activeInstructions = "manual task";
    store.currentTemplateId = null;
    store.history.splice(0);

    store.loadTemplate(
      template.size,
      template.main,
      template.secondary,
      null,
      template.id,
    );

    expect(store.history).toHaveLength(1);
    expect(store.currentTemplateId).toBe("heart");
    expect(store.gridData[2]?.[2]?.bg).toBe("#ef4444");

    store.undo();

    expect(store.history).toHaveLength(0);
    expect(store.gridData[0]?.[0]?.bg).toBe("#3b82f6");
    expect(store.gridData[2]?.[2]?.bg).toBeNull();
    expect(store.activeInstructions).toBe("manual task");
    expect(store.currentTemplateId).toBeNull();
  });

  it("restores template instructions after undoing a clear", () => {
    const store = useMatStore();
    const template = templateById("maze1");

    store.loadTemplate(
      template.size,
      template.main,
      template.secondary,
      null,
      template.id,
    );
    store.history.splice(0);

    store.clearBoard();

    expect(store.currentTemplateId).toBeNull();
    expect(store.activeInstructions).toBeNull();
    expect(store.gridData[0]?.[0]?.icon).toBeNull();

    store.undo();

    expect(store.currentTemplateId).toBe("maze1");
    expect(store.activeInstructions).toBe(store.t.tpl_maze1_instr);
    expect(store.hasSolution).toBe(true);
    expect(store.gridData[0]?.[0]?.icon).toBe("Bot");
  });

  it("undoes generated solutions without losing the active task", () => {
    const store = useMatStore();
    const template = templateById("coded_heart");

    store.loadTemplate(
      template.size,
      template.main,
      template.secondary,
      null,
      template.id,
    );
    store.history.splice(0);

    store.showSolution();

    expect(store.gridData[1]?.[2]?.bg).toBe("#ef4444");
    expect(store.currentTemplateId).toBe("coded_heart");

    store.undo();

    expect(store.gridData[1]?.[2]?.bg).toBeNull();
    expect(store.currentTemplateId).toBe("coded_heart");
    expect(store.activeInstructions).toBe(store.t.tpl_coded_heart_instr);
    expect(store.hasSolution).toBe(true);
  });
});

describe("matStore coordinate import", () => {
  beforeEach(() => {
    installBrowserStubs();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("imports a coordinates export and keeps the import undoable", () => {
    const store = useMatStore();

    const backgroundCell = store.gridData[0]?.[0];
    const iconCell = store.gridData[1]?.[1];
    const textCell = store.gridData[2]?.[2];
    const instructionCell = store.secondaryGridData[0]?.[1];

    if (!backgroundCell || !iconCell || !textCell || !instructionCell) {
      throw new Error("Expected initialized grids");
    }

    backgroundCell.bg = "#ef4444";
    iconCell.bg = "#22c55e";
    iconCell.icon = "Bot";
    textCell.text = "A";
    instructionCell.icon = "ArrowRight";

    const exportedText = store.getCoordinatesText();

    store.clearBoard();
    store.history.splice(0);

    expect(store.importCoordinatesText(exportedText)).toBe(true);

    expect(store.history).toHaveLength(1);
    expect(store.gridData[0]?.[0]?.bg).toBe("#ef4444");
    expect(store.gridData[1]?.[1]?.bg).toBe("#22c55e");
    expect(store.gridData[1]?.[1]?.icon).toBe("Bot");
    expect(store.gridData[2]?.[2]?.text).toBe("A");
    expect(store.secondaryGridData[0]?.[1]?.icon).toBe("ArrowRight");
    expect(store.currentTemplateId).toBeNull();
    expect(store.activeInstructions).toBeNull();

    store.undo();

    expect(store.gridData[0]?.[0]?.bg).toBeNull();
    expect(store.gridData[1]?.[1]?.bg).toBeNull();
    expect(store.gridData[1]?.[1]?.icon).toBeNull();
    expect(store.gridData[2]?.[2]?.text).toBeNull();
    expect(store.secondaryGridData[0]?.[1]?.icon).toBeNull();
  });

  it("infers the smallest supported grid size from imported coordinates", () => {
    const store = useMatStore();
    const coordinatesText = `Virtual Coding Mat Coordinates
==============================

Background: #22c55e
=> L12

Icon: ArrowRight
=> S1-12

Text: Z
=> C3
`;

    expect(store.importCoordinatesText(coordinatesText)).toBe(true);

    expect(store.gridSize).toBe(12);
    expect(store.gridData[11]?.[11]?.bg).toBe("#22c55e");
    expect(store.secondaryGridData[0]?.[11]?.icon).toBe("ArrowRight");
    expect(store.gridData[2]?.[2]?.text).toBe("Z");
  });

  it("preserves the declared size from new coordinates exports", () => {
    const store = useMatStore();

    store.initBoard(16);
    store.history.splice(0);

    const cell = store.gridData[0]?.[0];
    if (!cell) throw new Error("Expected initialized grid");
    cell.bg = "#3b82f6";

    const exportedText = store.getCoordinatesText();

    store.initBoard(10);
    store.history.splice(0);

    expect(store.importCoordinatesText(exportedText)).toBe(true);

    expect(store.gridSize).toBe(16);
    expect(store.gridData[0]?.[0]?.bg).toBe("#3b82f6");
  });

  it("rejects text without importable coordinates", () => {
    const store = useMatStore();

    expect(store.importCoordinatesText(store.t.emptyBoardAlert)).toBe(false);

    expect(store.history).toHaveLength(0);
    expect(store.gridSize).toBe(10);
  });
});

describe("matStore robot and goal simulation", () => {
  beforeEach(() => {
    installBrowserStubs();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("enforces single-placement of Bot and EvCharger on the top grid", () => {
    const store = useMatStore();

    // Set active tool to Bot icon
    store.activeTool = { type: "icon", value: "Bot" };

    // Place Bot at A1 (0, 0)
    store.updateCell(0, 0, false);
    expect(store.gridData[0]?.[0]?.icon).toBe("Bot");

    // Place Bot at B2 (1, 1)
    store.updateCell(1, 1, false);
    expect(store.gridData[1]?.[1]?.icon).toBe("Bot");
    // Old Bot should be cleared
    expect(store.gridData[0]?.[0]?.icon).toBeNull();

    // Place EvCharger (goal) at C3 (2, 2)
    store.activeTool = { type: "icon", value: "EvCharger" };
    store.updateCell(2, 2, false);
    expect(store.gridData[2]?.[2]?.icon).toBe("EvCharger");

    // Place EvCharger (goal) at D4 (3, 3)
    store.updateCell(3, 3, false);
    expect(store.gridData[3]?.[3]?.icon).toBe("EvCharger");
    // Old EvCharger should be cleared
    expect(store.gridData[2]?.[2]?.icon).toBeNull();
  });

  it("collides with colored backgrounds, but succeeds on success cells", () => {
    const store = useMatStore();

    // Place robot at (0, 0)
    store.activeTool = { type: "icon", value: "Bot" };
    store.updateCell(0, 0, false);

    // Place red background cell at (1, 0)
    store.activeTool = { type: "background", value: "#ef4444" };
    store.updateCell(1, 0, false);

    // Program ArrowDown instruction at S1-2
    store.secondaryGridData[0]![1]!.icon = "ArrowDown";

    // Start simulation
    store.startSimulation();
    expect(store.isSimulating).toBe(true);
    expect(store.simulationRobot?.r).toBe(0);
    expect(store.simulationRobot?.c).toBe(0);

    // Execute the step (Move Down into the red wall)
    store.nextSimulationStep();
    expect(store.simulationStatus).toBe("collision");
    // Verify it did not actually pass (stays in last valid position)
    expect(store.simulationRobot?.r).toBe(0);

    // Reset simulation
    store.resetSimulation();
    expect(store.simulationStatus).toBe("ready");

    // Now make (1, 0) a success cell (EvCharger) and test success
    store.gridData[1]![0]!.bg = null;
    store.gridData[1]![0]!.icon = "EvCharger";

    store.startSimulation();
    store.nextSimulationStep();
    expect(store.simulationStatus).toBe("success");
  });

  it("picks up other symbols while traveling and restores them upon reset", () => {
    const store = useMatStore();

    // Place robot at (0, 0)
    store.activeTool = { type: "icon", value: "Bot" };
    store.updateCell(0, 0, false);

    // Place a pickup symbol at (1, 0) (e.g. letter 'A')
    store.activeTool = { type: "text", value: "A" };
    store.updateCell(1, 0, false);

    // Place another pickup symbol at (2, 0) (e.g. icon 'Car')
    store.activeTool = { type: "icon", value: "Car" };
    store.updateCell(2, 0, false);

    // Program instructions: S1-2 ArrowDown, S1-3 ArrowDown
    store.secondaryGridData[0]![1]!.icon = "ArrowDown";
    store.secondaryGridData[0]![2]!.icon = "ArrowDown";

    // Verify symbols are on the board before simulation
    expect(store.gridData[1]![0]!.text).toBe("A");
    expect(store.gridData[2]![0]!.icon).toBe("Car");
    expect(store.simulationInventory).toHaveLength(0);

    // Start simulation
    store.startSimulation();
    expect(store.simulationInventory).toHaveLength(0);

    // Step 1: moves to (1, 0). It should pick up the 'A'
    store.nextSimulationStep();
    expect(store.simulationRobot?.r).toBe(1);
    expect(store.gridData[1]![0]!.text).toBeNull(); // Picked up!
    expect(store.simulationInventory).toHaveLength(1);
    expect(store.simulationInventory[0]).toEqual({ type: "text", value: "A" });

    // Step 2: moves to (2, 0). It should pick up the 'Car'
    store.nextSimulationStep();
    expect(store.simulationRobot?.r).toBe(2);
    expect(store.gridData[2]![0]!.icon).toBeNull(); // Picked up!
    expect(store.simulationInventory).toHaveLength(2);
    expect(store.simulationInventory[1]).toEqual({ type: "icon", value: "Car" });

    // Reset simulation
    store.resetSimulation();
    expect(store.simulationInventory).toHaveLength(0);

    // Verify symbols are fully restored!
    expect(store.gridData[1]![0]!.text).toBe("A");
    expect(store.gridData[2]![0]!.icon).toBe("Car");
  });

  it("supports repeating an instruction 6 times using Num6Icon", () => {
    const store = useMatStore();

    // Place robot at (0, 0)
    store.activeTool = { type: "icon", value: "Bot" };
    store.updateCell(0, 0, false);

    // Program ArrowDown instruction followed by Num6Icon
    store.secondaryGridData[0]![1]!.icon = "ArrowDown";
    store.secondaryGridData[0]![2]!.icon = "Num6Icon";

    // Start simulation
    store.startSimulation();

    // We expect ArrowDown followed by 5 repetitions, so 6 steps of ArrowDown total
    expect(store.simulationSteps).toHaveLength(6);
    store.simulationSteps.forEach((step) => {
      expect(step.action).toBe("MOVE_DOWN");
    });
  });
});

describe("matStore edit gestures during simulation", () => {
  beforeEach(() => {
    installBrowserStubs();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("blocks strokes while the simulation is running and records none in history", () => {
    const store = useMatStore();

    store.activeTool = { type: "icon", value: "Bot" };
    store.updateCell(0, 0, false);
    store.secondaryGridData[0]![1]!.icon = "ArrowDown";
    store.history.splice(0);

    store.startSimulation();
    expect(store.simulationStatus).toBe("running");

    expect(store.beginStroke()).toBe(false);
    expect(store.history).toHaveLength(0);

    store.resetSimulation();
  });

  it("rolls back picked-up items before snapshotting history for a new stroke", () => {
    const store = useMatStore();

    store.activeTool = { type: "icon", value: "Bot" };
    store.updateCell(0, 0, false);
    store.activeTool = { type: "text", value: "A" };
    store.updateCell(1, 0, false);
    store.secondaryGridData[0]![1]!.icon = "ArrowDown";

    store.startSimulation();
    store.nextSimulationStep();
    store.pauseSimulation();
    expect(store.gridData[1]![0]!.text).toBeNull(); // picked up mid-simulation

    store.history.splice(0);
    expect(store.beginStroke()).toBe(true);

    // The simulation was reset, the item restored, and the snapshot captured *after* that
    expect(store.isSimulating).toBe(false);
    expect(store.gridData[1]![0]!.text).toBe("A");
    expect(store.history).toHaveLength(1);

    store.gridData[1]![0]!.text = null;
    store.undo();
    expect(store.gridData[1]![0]!.text).toBe("A");
  });

  it("resets an active simulation before loading a template", () => {
    const store = useMatStore();
    const template = templateById("maze1");

    store.activeTool = { type: "icon", value: "Bot" };
    store.updateCell(0, 0, false);
    store.secondaryGridData[0]![1]!.icon = "ArrowDown";
    store.startSimulation();

    store.loadTemplate(template.size, template.main, template.secondary, null, template.id);

    expect(store.isSimulating).toBe(false);
    expect(store.simulationStatus).toBe("ready");
    expect(store.currentTemplateId).toBe("maze1");
  });
});

describe("matStore clearCell", () => {
  beforeEach(() => {
    installBrowserStubs();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears a cell's background, icon and text", () => {
    const store = useMatStore();
    const cell = store.gridData[2]![3]!;
    cell.bg = "#ef4444";
    cell.icon = "Car";

    store.clearCell(2, 3, false);

    expect(cell.bg).toBeNull();
    expect(cell.icon).toBeNull();
    expect(cell.text).toBeNull();
  });

  it("never erases the protected start icon on the secondary grid", () => {
    const store = useMatStore();

    store.clearCell(0, 0, true);

    expect(store.secondaryGridData[0]![0]!.icon).toBe("Play");
  });
});

describe("matStore layout settings", () => {
  beforeEach(() => {
    installBrowserStubs();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults showSecondaryGrid to true", () => {
    const store = useMatStore();
    expect(store.showSecondaryGrid).toBe(true);
  });

  it("initializes showSecondaryGrid to false if vcm_show_secondary is set to false in localStorage", () => {
    localStorage.setItem("vcm_show_secondary", "false");
    const store = useMatStore();
    expect(store.showSecondaryGrid).toBe(false);
  });
});

describe("matStore custom templates", () => {
  beforeEach(() => {
    installBrowserStubs();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves the current board layout as a custom template with correct metadata", () => {
    const store = useMatStore();
    store.initBoard(12);

    const cell = store.gridData[2]?.[3];
    if (!cell) throw new Error("Expected cell to be initialized");
    cell.bg = "#ef4444";
    cell.icon = "Bot";

    const secCell = store.secondaryGridData[0]?.[1];
    if (!secCell) throw new Error("Expected secondary cell to be initialized");
    secCell.icon = "ArrowUp";

    store.saveCurrentAsTemplate("My Custom Maze", "Learn standard coding", "Follow instructions carefully");

    expect(store.customTemplates).toHaveLength(1);
    const saved = store.customTemplates[0]!;
    expect(saved.name).toBe("My Custom Maze");
    expect(saved.desc).toBe("Learn standard coding");
    expect(saved.instructions).toBe("Follow instructions carefully");
    expect(saved.size).toBe(12);
    expect(saved.main).toContainEqual([2, 3, "#ef4444", "Bot", null]);
    expect(saved.secondary).toContainEqual([0, 1, null, "ArrowUp", null]);
  });

  it("loads a custom template and restores grid layouts and instructions", () => {
    const store = useMatStore();
    store.customTemplates = [
      {
        id: "custom_12345",
        name: "Test Saved",
        desc: "Task desc",
        size: 14,
        main: [[1, 2, "#ef4444", "Bot", null]],
        secondary: [[0, 1, null, "ArrowRight", null]],
        instructions: "Step by step instruction set",
        createdAt: Date.now(),
      },
    ];

    const tpl = store.customTemplates[0]!;
    store.loadTemplate(tpl.size, tpl.main, tpl.secondary, tpl.instructions, tpl.id);

    expect(store.gridSize).toBe(14);
    expect(store.gridData[1]?.[2]?.bg).toBe("#ef4444");
    expect(store.gridData[1]?.[2]?.icon).toBe("Bot");
    expect(store.secondaryGridData[0]?.[1]?.icon).toBe("ArrowRight");
    expect(store.activeInstructions).toBe("Step by step instruction set");
    expect(store.currentTemplateId).toBe("custom_12345");
  });

  it("deletes a custom template and clears active template id if matched", () => {
    const store = useMatStore();
    store.customTemplates = [
      {
        id: "custom_1",
        name: "Mat 1",
        desc: "Desc",
        size: 10,
        main: [],
        secondary: [],
        instructions: "Run it",
        createdAt: Date.now(),
      },
    ];

    store.currentTemplateId = "custom_1";
    store.activeInstructions = "Run it";

    store.deleteCustomTemplate("custom_1");

    expect(store.customTemplates).toHaveLength(0);
    expect(store.currentTemplateId).toBeNull();
    expect(store.activeInstructions).toBeNull();
  });

  it("updates/overwrites an existing custom template", () => {
    const store = useMatStore();
    store.customTemplates = [
      {
        id: "custom_1",
        name: "Old Mat",
        desc: "Old Desc",
        size: 10,
        main: [],
        secondary: [],
        instructions: "Old instr",
        createdAt: Date.now(),
      },
    ];

    store.initBoard(16);
    const cell = store.gridData[0]?.[0];
    if (!cell) throw new Error("Expected cell to be initialized");
    cell.bg = "#ef4444";

    store.updateCustomTemplate("custom_1", "Updated Mat Name", "New Desc", "New instr");

    expect(store.customTemplates).toHaveLength(1);
    const updated = store.customTemplates[0]!;
    expect(updated.name).toBe("Updated Mat Name");
    expect(updated.desc).toBe("New Desc");
    expect(updated.instructions).toBe("New instr");
    expect(updated.size).toBe(16);
    expect(updated.main).toContainEqual([0, 0, "#ef4444", null, null]);
  });
});
