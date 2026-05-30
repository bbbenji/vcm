import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { templates } from '../utils/templates'

export const GRID_SIZES = [10, 12, 14, 16, 18, 20] as const

export type ToolType = 'background' | 'icon' | 'text' | 'eraser' | 'task'
export type GridSize = (typeof GRID_SIZES)[number]

export interface ActiveTool {
  type: ToolType
  value: string | null
}

export interface GridCell {
  id: string // e.g., 'A1'
  bg: string | null
  icon: string | null
  text: string | null
}

type CompactCell = [number, number, string | null, string | null, string | null]

interface CompactState {
  s: GridSize
  m: CompactCell[]
  sec: CompactCell[]
}

const DEFAULT_GRID_SIZE: GridSize = 10
const SECONDARY_ROWS = 3
const MAX_HISTORY = 50
const START_ICON = 'Play'
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function isGridSize(value: unknown): value is GridSize {
  return typeof value === 'number' && GRID_SIZES.includes(value as GridSize)
}

function normalizeGridSize(size: number): GridSize {
  return isGridSize(size) ? size : DEFAULT_GRID_SIZE
}

function asNullableString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function isCompactState(value: unknown): value is CompactState {
  if (!value || typeof value !== 'object') return false

  const state = value as Partial<CompactState>
  return isGridSize(state.s) && Array.isArray(state.m) && Array.isArray(state.sec)
}

function isCompactCell(value: unknown): value is CompactCell {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    Number.isInteger(value[0]) &&
    Number.isInteger(value[1])
  )
}

export interface ExecStep {
  action: 'MOVE_UP' | 'MOVE_DOWN' | 'MOVE_RIGHT' | 'MOVE_LEFT' | 'TURN_RIGHT' | 'TURN_LEFT'
  sourceCell: { r: number; c: number }
}

export const useMatStore = defineStore('mat', () => {
  const gridSize = ref<GridSize>(DEFAULT_GRID_SIZE)
  const activeTool = ref<ActiveTool>({ type: 'background', value: '#3b82f6' }) // Default blue bg
  const gridData = ref<GridCell[][]>([])
  const secondaryGridData = ref<GridCell[][]>([])
  const history = ref<string[]>([])
  const activeInstructions = ref<string | null>(null)
  const currentTemplateId = ref<string | null>(null)

  const hasSolution = computed(() => {
    if (!currentTemplateId.value) return false
    const tpl = templates.find((t) => t.id === currentTemplateId.value)
    return !!(tpl?.mainSolution || tpl?.secondarySolution)
  })

  const instructionsExist = computed(() => {
    for (let r = 0; r < SECONDARY_ROWS; r++) {
      const row = secondaryGridData.value[r]
      if (!row) continue
      for (let c = 0; c < gridSize.value; c++) {
        if (r === 0 && c === 0) continue
        const cell = row[c]
        if (cell && (cell.icon || cell.text)) {
          return true
        }
      }
    }
    return false
  })

  // Simulation State
  const isSimulating = ref(false)
  const simulationStep = ref(0)
  const simulationRobot = ref<{ r: number; c: number; dir: 'UP' | 'RIGHT' | 'DOWN' | 'LEFT'; icon: string } | null>(null)
  const simulationStatus = ref<'ready' | 'running' | 'success' | 'collision' | 'out_of_bounds' | 'paused'>('ready')
  const simulationSpeed = ref(1000) // ms per step
  const simulationSteps = ref<ExecStep[]>([])
  const simulationActiveInstructionId = ref<string | null>(null)

  let simulationTimer: ReturnType<typeof setInterval> | null = null

  function getCompactState() {
    const compactMain: CompactCell[] = []
    for (let r = 0; r < gridSize.value; r++) {
      const row = gridData.value[r]
      if (!row) continue
      for (let c = 0; c < gridSize.value; c++) {
        const cell = row[c]
        if (cell && (cell.bg || cell.icon || cell.text)) {
          compactMain.push([r, c, cell.bg, cell.icon, cell.text])
        }
      }
    }

    const compactSec: CompactCell[] = []
    for (let r = 0; r < SECONDARY_ROWS; r++) {
      const row = secondaryGridData.value[r]
      if (!row) continue
      for (let c = 0; c < gridSize.value; c++) {
        const cell = row[c]
        if (
          cell &&
          (cell.bg || cell.text || (cell.icon && !(r === 0 && c === 0 && cell.icon === START_ICON)))
        ) {
          compactSec.push([r, c, cell.bg, cell.icon, cell.text])
        }
      }
    }

    return {
      s: gridSize.value,
      m: compactMain,
      sec: compactSec,
    }
  }

  function syncToUrl() {
    if (typeof window === 'undefined') return

    const state = getCompactState()
    const urlPath = `${window.location.pathname}${window.location.search}`
    if (state.m.length === 0 && state.sec.length === 0 && state.s === DEFAULT_GRID_SIZE) {
      window.history.replaceState(null, '', urlPath)
      return
    }
    const json = JSON.stringify(state)
    const encoded = btoa(encodeURIComponent(json))
    window.history.replaceState(null, '', `${urlPath}#state=${encoded}`)
  }

  function applyCompactCells(cells: unknown[], targetGrid: GridCell[][]) {
    cells.forEach((item) => {
      if (!isCompactCell(item)) return

      const [r, c, bg, icon, text] = item
      const cell = targetGrid[r]?.[c]
      if (!cell) return

      cell.bg = asNullableString(bg)
      cell.icon = asNullableString(icon)
      cell.text = asNullableString(text)
    })
  }

  function loadFromUrl() {
    if (typeof window === 'undefined') return false

    const hash = window.location.hash
    if (hash && hash.startsWith('#state=')) {
      try {
        const encoded = hash.substring(7)
        const json = decodeURIComponent(atob(encoded))
        const state = JSON.parse(json) as unknown

        if (!isCompactState(state)) return false

        initBoard(state.s, false)
        applyCompactCells(state.m, gridData.value)
        applyCompactCells(state.sec, secondaryGridData.value)

        const startCell = secondaryGridData.value[0]?.[0]
        if (startCell) startCell.icon = START_ICON

        return true
      } catch (e) {
        console.error('Failed to load state from URL', e)
      }
    }
    return false
  }

  function saveHistory() {
    const snapshot = JSON.stringify({
      size: gridSize.value,
      main: gridData.value,
      secondary: secondaryGridData.value,
    })
    history.value.push(snapshot)
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
  }

  function undo() {
    if (isSimulating.value) {
      resetSimulation()
    }
    if (history.value.length === 0) return
    const lastSnapshot = history.value.pop()
    if (lastSnapshot) {
      const parsed = JSON.parse(lastSnapshot)
      gridSize.value = parsed.size
      gridData.value = parsed.main
      secondaryGridData.value = parsed.secondary
      syncToUrl()
    }
  }

  function initBoard(size: number, sync = true) {
    if (isSimulating.value) {
      resetSimulation()
    }
    if (gridData.value.length > 0) {
      saveHistory()
    }
    gridSize.value = normalizeGridSize(size)
    const newGrid: GridCell[][] = []
    for (let row = 0; row < gridSize.value; row++) {
      const rowData: GridCell[] = []
      for (let col = 0; col < gridSize.value; col++) {
        const letter = alphabet[col % alphabet.length] ?? ''
        const number = row + 1
        rowData.push({
          id: `${letter}${number}`,
          bg: null,
          icon: null,
          text: null,
        })
      }
      newGrid.push(rowData)
    }
    gridData.value = newGrid

    const newSecondaryGrid: GridCell[][] = []
    for (let row = 0; row < SECONDARY_ROWS; row++) {
      const rowData: GridCell[] = []
      for (let col = 0; col < gridSize.value; col++) {
        rowData.push({
          id: `S${row + 1}-${col + 1}`,
          bg: null,
          icon: row === 0 && col === 0 ? START_ICON : null,
          text: null,
        })
      }
      newSecondaryGrid.push(rowData)
    }
    secondaryGridData.value = newSecondaryGrid

    if (sync) {
      syncToUrl()
    }
  }

  function clearBoard() {
    if (isSimulating.value) {
      resetSimulation()
    }
    saveHistory()
    activeInstructions.value = null
    currentTemplateId.value = null
    gridData.value.forEach((row) => {
      row.forEach((cell) => {
        cell.bg = null
        cell.icon = null
        cell.text = null
      })
    })
    secondaryGridData.value.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        cell.bg = null
        cell.icon = rIdx === 0 && cIdx === 0 ? START_ICON : null
        cell.text = null
      })
    })
    syncToUrl()
  }

  function loadTemplate(size: GridSize, mainCells: CompactCell[], secCells: CompactCell[], instructions: string | null = null, id: string | null = null) {
    saveHistory()
    currentTemplateId.value = id
    activeInstructions.value = instructions
    initBoard(size, false)
    applyCompactCells(mainCells, gridData.value)
    applyCompactCells(secCells, secondaryGridData.value)
    const startCell = secondaryGridData.value[0]?.[0]
    if (startCell) startCell.icon = START_ICON
    syncToUrl()
  }

  function showSolution() {
    if (!currentTemplateId.value) return
    const tpl = templates.find((t) => t.id === currentTemplateId.value)
    if (!tpl) return

    saveHistory()

    if (tpl.mainSolution) {
      applyCompactCells(tpl.mainSolution, gridData.value)
    }

    if (tpl.secondarySolution) {
      applyCompactCells(tpl.secondarySolution, secondaryGridData.value)
    }

    const startCell = secondaryGridData.value[0]?.[0]
    if (startCell) startCell.icon = START_ICON

    syncToUrl()
  }

  function updateCell(row: number, col: number, isSecondary = false) {
    if (isSimulating.value && simulationStatus.value === 'running') {
      return
    }
    if (isSimulating.value) {
      resetSimulation()
    }
    const cell = isSecondary ? secondaryGridData.value[row]?.[col] : gridData.value[row]?.[col]
    if (!cell) return

    const tool = activeTool.value

    // Prevent overriding the start icon
    if (isSecondary && row === 0 && col === 0) return

    if (tool.type === 'eraser') {
      cell.bg = null
      cell.icon = null
      cell.text = null
    } else if (tool.type === 'background') {
      cell.bg = tool.value
    } else if (tool.type === 'icon') {
      cell.icon = tool.value
      cell.text = null
    } else if (tool.type === 'text') {
      cell.text = tool.value
      cell.icon = null
    }

    syncToUrl()
  }

  function getCoordinatesText() {
    const coords: Record<string, string[]> = {}

    const extractCoords = (grid: GridCell[][]) => {
      for (const row of grid) {
        for (const cell of row) {
          if (cell.bg) {
            const key = `Background: ${cell.bg}`
            if (!coords[key]) coords[key] = []
            coords[key].push(cell.id)
          }
          if (cell.icon && !(cell.id === 'S1-1' && cell.icon === START_ICON)) {
            const key = `Icon: ${cell.icon}`
            if (!coords[key]) coords[key] = []
            coords[key].push(cell.id)
          }
          if (cell.text) {
            const key = `Text: ${cell.text}`
            if (!coords[key]) coords[key] = []
            coords[key].push(cell.id)
          }
        }
      }
    }

    extractCoords(gridData.value)
    extractCoords(secondaryGridData.value)

    if (Object.keys(coords).length === 0) {
      return 'The board is empty.'
    }

    let result = 'Virtual Coding Mat Coordinates\n==============================\n\n'
    for (const [key, values] of Object.entries(coords)) {
      result += `${key}\n=> ${values.join(', ')}\n\n`
    }
    return result
  }

  function getDirectionAngle(dir: 'UP' | 'RIGHT' | 'DOWN' | 'LEFT'): number {
    switch (dir) {
      case 'UP': return 0
      case 'RIGHT': return 90
      case 'DOWN': return 180
      case 'LEFT': return 270
    }
  }

  function nextDirection(current: 'UP' | 'RIGHT' | 'DOWN' | 'LEFT', rotation: 1 | -1): 'UP' | 'RIGHT' | 'DOWN' | 'LEFT' {
    const dirs: ('UP' | 'RIGHT' | 'DOWN' | 'LEFT')[] = ['UP', 'RIGHT', 'DOWN', 'LEFT']
    const idx = dirs.indexOf(current)
    const nextIdx = (idx + rotation + 4) % 4
    return dirs[nextIdx]!
  }

  function parseSimulationSteps() {
    const rawList: { r: number; c: number; icon: string | null; text: string | null }[] = []
    
    // Read secondary grid: row by row, from left to right. Skip (0, 0) which is Play.
    for (let r = 0; r < SECONDARY_ROWS; r++) {
      const row = secondaryGridData.value[r]
      if (!row) continue
      for (let c = 0; c < gridSize.value; c++) {
        if (r === 0 && c === 0) continue // Skip the green Play icon
        const cell = row[c]
        if (cell && (cell.icon || cell.text)) {
          rawList.push({ r, c, icon: cell.icon, text: cell.text })
        }
      }
    }

    const steps: ExecStep[] = []
    let lastAction: 'MOVE_UP' | 'MOVE_DOWN' | 'MOVE_RIGHT' | 'MOVE_LEFT' | 'TURN_RIGHT' | 'TURN_LEFT' | null = null
    let lastSourceCell: { r: number; c: number } | null = null

    for (const item of rawList) {
      let action: 'MOVE_UP' | 'MOVE_DOWN' | 'MOVE_RIGHT' | 'MOVE_LEFT' | 'TURN_RIGHT' | 'TURN_LEFT' | null = null

      if (item.icon) {
        if (item.icon === 'ArrowUp') action = 'MOVE_UP'
        else if (item.icon === 'ArrowDown') action = 'MOVE_DOWN'
        else if (item.icon === 'ArrowRight') action = 'MOVE_RIGHT'
        else if (item.icon === 'ArrowLeft') action = 'MOVE_LEFT'
        else if (['CornerUpRight', 'RotateCw'].includes(item.icon)) action = 'TURN_RIGHT'
        else if (['CornerUpLeft', 'RotateCcw'].includes(item.icon)) action = 'TURN_LEFT'
      }

      if (action) {
        steps.push({ action, sourceCell: { r: item.r, c: item.c } })
        lastAction = action
        lastSourceCell = { r: item.r, c: item.c }
      } else {
        // Check repeat counts
        const textVal = item.text || ''
        const iconVal = item.icon || ''
        let repeatCount = 0

        if (['2', 'Num2Icon'].includes(textVal) || iconVal === 'Num2Icon') repeatCount = 2
        else if (['3', 'Num3Icon'].includes(textVal) || iconVal === 'Num3Icon') repeatCount = 3
        else if (['4', 'Num4Icon'].includes(textVal) || iconVal === 'Num4Icon') repeatCount = 4
        else if (['5', 'Num5Icon'].includes(textVal) || iconVal === 'Num5Icon') repeatCount = 5

        if (repeatCount > 0 && lastAction && lastSourceCell) {
          // Repeat (repeatCount - 1) times since first is already added
          for (let i = 0; i < repeatCount - 1; i++) {
            steps.push({ action: lastAction, sourceCell: lastSourceCell })
          }
        }
      }
    }

    simulationSteps.value = steps
  }

  function findStartingCharacter() {
    const characterIcons = [
      'Bot', 'Ship', 'Car', 'TrainFront', 'Plane', 'Tractor', 'Bus', 'Bike',
      'Cat', 'Dog', 'Bird', 'Rabbit', 'Snail', 'Bug', 'Fish', 'Turtle'
    ]

    for (let r = 0; r < gridSize.value; r++) {
      const row = gridData.value[r]
      if (!row) continue
      for (let c = 0; c < gridSize.value; c++) {
        const cell = row[c]
        if (cell && cell.icon && characterIcons.includes(cell.icon)) {
          return { r, c, icon: cell.icon }
        }
      }
    }
    return null
  }

  function startSimulation() {
    if (!instructionsExist.value) return

    // Stop any existing simulation
    stopTimer()

    // 1. Find starting robot / character
    let startChar = findStartingCharacter()
    
    // If no character found, try to locate a sensible default
    if (!startChar) {
      // Check templates default starting points
      const hasGoalJ10 = gridData.value[9]?.[9]?.icon === 'Puzzle'
      const hasGoalJ1 = gridData.value[0]?.[9]?.icon === 'Puzzle'
      
      if (hasGoalJ1) {
        // Pirate maze starting position is A10 (9, 0)
        startChar = { r: 9, c: 0, icon: 'Ship' }
      } else if (hasGoalJ10) {
        // Robot maze starting position is A1 (0, 0)
        startChar = { r: 0, c: 0, icon: 'Bot' }
      } else {
        // Generic default
        startChar = { r: 0, c: 0, icon: 'Bot' }
      }
    }

    // 2. Parse instruction steps
    parseSimulationSteps()

    // 3. Set up simulator state
    simulationRobot.value = {
      r: startChar.r,
      c: startChar.c,
      dir: 'UP',
      icon: startChar.icon
    }
    isSimulating.value = true
    simulationStep.value = 0
    simulationStatus.value = 'running'
    simulationActiveInstructionId.value = null

    // 4. Begin execution loop
    startTimer()
  }

  function startTimer() {
    stopTimer()
    simulationTimer = setInterval(() => {
      nextSimulationStep()
    }, simulationSpeed.value)
  }

  function stopTimer() {
    if (simulationTimer) {
      clearInterval(simulationTimer)
      simulationTimer = null
    }
  }

  function pauseSimulation() {
    stopTimer()
    simulationStatus.value = 'paused'
  }

  function resumeSimulation() {
    if (simulationStatus.value === 'paused' && isSimulating.value) {
      simulationStatus.value = 'running'
      startTimer()
    }
  }

  function resetSimulation() {
    stopTimer()
    isSimulating.value = false
    simulationStep.value = 0
    simulationStatus.value = 'ready'
    simulationRobot.value = null
    simulationActiveInstructionId.value = null
    simulationSteps.value = []
  }

  function changeSpeed(ms: number) {
    simulationSpeed.value = ms
    if (simulationStatus.value === 'running') {
      startTimer()
    }
  }

  function isSuccessCell(r: number, c: number): boolean {
    const cell = gridData.value[r]?.[c]
    if (!cell) return false
    return cell.icon === 'Puzzle' || cell.bg === '#eab308'
  }

  function isObstacleCell(r: number, c: number): boolean {
    const cell = gridData.value[r]?.[c]
    if (!cell) return false
    return cell.bg === '#475569'
  }

  function nextSimulationStep() {
    if (!isSimulating.value || !simulationRobot.value) return

    // If we finished all steps, check for final status
    if (simulationStep.value >= simulationSteps.value.length) {
      stopTimer()
      const robot = simulationRobot.value
      if (isSuccessCell(robot.r, robot.c)) {
        simulationStatus.value = 'success'
      } else {
        simulationStatus.value = 'ready'
      }
      simulationActiveInstructionId.value = null
      return
    }

    const step = simulationSteps.value[simulationStep.value]!
    simulationActiveInstructionId.value = `S${step.sourceCell.r + 1}-${step.sourceCell.c + 1}`

    const robot = simulationRobot.value

    // Execute step
    if (step.action === 'TURN_RIGHT') {
      robot.dir = nextDirection(robot.dir, 1)
    } else if (step.action === 'TURN_LEFT') {
      robot.dir = nextDirection(robot.dir, -1)
    } else {
      let nextR = robot.r
      let nextC = robot.c

      if (step.action === 'MOVE_UP') {
        nextR -= 1
        robot.dir = 'UP'
      } else if (step.action === 'MOVE_DOWN') {
        nextR += 1
        robot.dir = 'DOWN'
      } else if (step.action === 'MOVE_RIGHT') {
        nextC += 1
        robot.dir = 'RIGHT'
      } else if (step.action === 'MOVE_LEFT') {
        nextC -= 1
        robot.dir = 'LEFT'
      }

      // Verify out of bounds
      if (nextR < 0 || nextR >= gridSize.value || nextC < 0 || nextC >= gridSize.value) {
        robot.r = nextR
        robot.c = nextC
        simulationStatus.value = 'out_of_bounds'
        stopTimer()
        simulationActiveInstructionId.value = null
        return
      }

      // Verify collision
      if (isObstacleCell(nextR, nextC)) {
        robot.r = nextR
        robot.c = nextC
        simulationStatus.value = 'collision'
        stopTimer()
        simulationActiveInstructionId.value = null
        return
      }

      robot.r = nextR
      robot.c = nextC
    }

    // Increment step counter
    simulationStep.value += 1

    // Check if we hit success at this step
    if (isSuccessCell(robot.r, robot.c)) {
      simulationStatus.value = 'success'
      stopTimer()
      simulationActiveInstructionId.value = null
      return
    }

    // Check if that was the last step and we are not on success
    if (simulationStep.value === simulationSteps.value.length) {
      stopTimer()
      if (isSuccessCell(robot.r, robot.c)) {
        simulationStatus.value = 'success'
      } else {
        simulationStatus.value = 'ready'
      }
      simulationActiveInstructionId.value = null
    }
  }

  // Initialize on store creation
  if (!loadFromUrl()) {
    initBoard(gridSize.value, false)
  }

  // Clear initial history state added by initBoard on load
  history.value = []

  return {
    gridSize,
    activeTool,
    gridData,
    secondaryGridData,
    history,
    initBoard,
    clearBoard,
    updateCell,
    saveHistory,
    undo,
    getCoordinatesText,
    loadTemplate,
    activeInstructions,
    currentTemplateId,
    hasSolution,
    instructionsExist,
    showSolution,
    // Simulation state and methods
    isSimulating,
    simulationStep,
    simulationRobot,
    simulationStatus,
    simulationSpeed,
    simulationSteps,
    simulationActiveInstructionId,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    changeSpeed,
    nextSimulationStep,
    getDirectionAngle,
  }
})
