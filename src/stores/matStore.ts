import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { templates } from '../utils/templates'
import { playDraw, playStep, playSuccess, playCollision } from '../utils/audio'
import { translations } from '../utils/i18n'
import type { Language } from '../utils/i18n'

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

interface HistorySnapshot {
  size: GridSize
  main: GridCell[][]
  secondary: GridCell[][]
  activeInstructions: string | null
  currentTemplateId: string | null
}

type CoordinateImportKind = 'bg' | 'icon' | 'text'

interface CoordinateImportTarget {
  row: number
  col: number
  isSecondary: boolean
}

interface ParsedCoordinateImport {
  size: GridSize
  main: CompactCell[]
  secondary: CompactCell[]
}

const DEFAULT_GRID_SIZE: GridSize = 10
const SECONDARY_ROWS = 3
const MAX_HISTORY = 50
const MAX_GRID_SIZE = 20
const START_ICON = 'Play'
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function isGridSize(value: unknown): value is GridSize {
  return typeof value === 'number' && GRID_SIZES.includes(value as GridSize)
}

function normalizeGridSize(size: number): GridSize {
  return isGridSize(size) ? size : DEFAULT_GRID_SIZE
}

function inferGridSize(requiredSize: number): GridSize | null {
  return GRID_SIZES.find((size) => size >= requiredSize) ?? null
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

function getCoordinateImportHeading(line: string) {
  const separatorIndex = line.indexOf(':')
  if (separatorIndex === -1) return null

  const label = line.slice(0, separatorIndex).trim().toLocaleLowerCase()
  const value = line.slice(separatorIndex + 1).trim()
  if (!value) return null

  if (label === 'tło' || label === 'background') {
    return { kind: 'bg' as const, value }
  }
  if (label === 'ikona' || label === 'icon') {
    return { kind: 'icon' as const, value }
  }
  if (label === 'tekst' || label === 'text') {
    return { kind: 'text' as const, value }
  }

  return null
}

function getCoordinateImportSize(line: string): GridSize | null {
  const match = line
    .trim()
    .toLocaleLowerCase()
    .match(/^(?:rozmiar|size):\s*(\d{1,2})(?:\s*x\s*\d{1,2})?$/)
  if (!match) return null

  const size = Number(match[1])
  return isGridSize(size) ? size : null
}

function parseCoordinateToken(token: string): CoordinateImportTarget | null {
  const normalized = token.trim().toUpperCase()
  const secondaryMatch = normalized.match(/^S([1-3])-([1-9]\d?)$/)
  if (secondaryMatch) {
    const row = Number(secondaryMatch[1]) - 1
    const col = Number(secondaryMatch[2]) - 1
    if (row < 0 || row >= SECONDARY_ROWS || col < 0 || col >= MAX_GRID_SIZE) return null
    return { row, col, isSecondary: true }
  }

  const mainMatch = normalized.match(/^([A-Z])([1-9]\d?)$/)
  if (!mainMatch) return null

  const letter = mainMatch[1]
  if (!letter) return null

  const col = alphabet.indexOf(letter)
  const row = Number(mainMatch[2]) - 1
  if (row < 0 || row >= MAX_GRID_SIZE || col < 0 || col >= MAX_GRID_SIZE) return null

  return { row, col, isSecondary: false }
}

function parseCoordinateImport(text: string): ParsedCoordinateImport | null {
  const main = new Map<string, CompactCell>()
  const secondary = new Map<string, CompactCell>()
  let activeKind: CoordinateImportKind | null = null
  let activeValue: string | null = null
  let importedCells = 0
  let requiredSize: number = DEFAULT_GRID_SIZE
  let declaredSize: GridSize | null = null

  const mergeCell = (target: CoordinateImportTarget, kind: CoordinateImportKind, value: string) => {
    const cells = target.isSecondary ? secondary : main
    const key = `${target.row}:${target.col}`
    const compactCell = cells.get(key) ?? [target.row, target.col, null, null, null]

    if (kind === 'bg') {
      compactCell[2] = value
    } else if (kind === 'icon') {
      compactCell[3] = value
      compactCell[4] = null
    } else {
      compactCell[3] = null
      compactCell[4] = value
    }

    cells.set(key, compactCell)
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const importedSize = getCoordinateImportSize(trimmed)
    if (importedSize) {
      declaredSize = importedSize
      continue
    }

    const heading = getCoordinateImportHeading(trimmed)
    if (heading) {
      activeKind = heading.kind
      activeValue = heading.value
      continue
    }

    if (!trimmed.startsWith('=>') || !activeKind || !activeValue) continue

    const tokens = trimmed.slice(2).split(',')
    for (const token of tokens) {
      const target = parseCoordinateToken(token)
      if (!target) continue

      mergeCell(target, activeKind, activeValue)
      if (!target.isSecondary) {
        requiredSize = Math.max(requiredSize, target.row + 1)
      }
      requiredSize = Math.max(requiredSize, target.col + 1)
      importedCells += 1
    }
  }

  if (importedCells === 0) return null

  const size =
    declaredSize && declaredSize >= requiredSize ? declaredSize : inferGridSize(requiredSize)
  if (!size) return null

  return { size, main: Array.from(main.values()), secondary: Array.from(secondary.values()) }
}

function debounce<T extends (...args: never[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  } as unknown as T
}

export interface ExecStep {
  action: 'MOVE_UP' | 'MOVE_DOWN' | 'MOVE_RIGHT' | 'MOVE_LEFT' | 'TURN_RIGHT' | 'TURN_LEFT'
  sourceCell: { r: number; c: number }
}

export const useMatStore = defineStore('mat', () => {
  // Localization, Sound, and Theme states
  const lang = ref<Language>((localStorage.getItem('vcm_lang') as Language) || 'pl')
  const isDarkMode = ref<boolean>(localStorage.getItem('vcm_theme') === 'dark')
  const soundEnabled = ref<boolean>(localStorage.getItem('vcm_sound') === 'true')

  const t = computed(() => translations[lang.value])

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
  const simulationRobot = ref<{
    r: number
    c: number
    dir: 'UP' | 'RIGHT' | 'DOWN' | 'LEFT'
    icon: string
  } | null>(null)
  const simulationStatus = ref<
    'ready' | 'running' | 'success' | 'collision' | 'out_of_bounds' | 'paused'
  >('ready')
  const simulationSpeed = ref(800) // ms per step
  const simulationSteps = ref<ExecStep[]>([])
  const simulationActiveInstructionId = ref<string | null>(null)
  const simulationPathHistory = ref<{ r: number; c: number }[]>([])
  const preSimGridData = ref<GridCell[][] | null>(null)
  const simulationInventory = ref<{ type: 'icon' | 'text'; value: string }[]>([])

  let simulationTimer: ReturnType<typeof setInterval> | null = null

  // Language & Theme Toggle Actions
  function toggleLanguage() {
    lang.value = lang.value === 'pl' ? 'en' : 'pl'
    localStorage.setItem('vcm_lang', lang.value)

    // If active instructions are currently loaded from a template, update them dynamically
    if (currentTemplateId.value) {
      const tpl = templates.find((t) => t.id === currentTemplateId.value)
      if (tpl) {
        if (tpl.instructions) {
          // If template key exists, map to i18n instructions key
          const key = `tpl_${currentTemplateId.value}_instr` as keyof typeof t.value
          activeInstructions.value = (t.value[key] as string) || tpl.instructions
        } else {
          activeInstructions.value = null
        }
      }
    }
  }

  function toggleTheme() {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('vcm_theme', isDarkMode.value ? 'dark' : 'light')
    applyThemeClass()
  }

  function applyThemeClass() {
    if (typeof document !== 'undefined') {
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    localStorage.setItem('vcm_sound', soundEnabled.value ? 'true' : 'false')
  }

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

  // Create highly optimized debounced url sync for drag-drawing!
  const syncToUrlDebounced = debounce(syncToUrl, 150)

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

        initBoard(state.s, false, false)
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
      activeInstructions: activeInstructions.value,
      currentTemplateId: currentTemplateId.value,
    })
    history.value.push(snapshot)
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
  }

  function restoreHistory(snapshot: string) {
    const parsed = JSON.parse(snapshot) as Partial<HistorySnapshot>

    gridSize.value = normalizeGridSize(Number(parsed.size))
    if (Array.isArray(parsed.main)) {
      gridData.value = parsed.main
    }
    if (Array.isArray(parsed.secondary)) {
      secondaryGridData.value = parsed.secondary
    }
    activeInstructions.value = asNullableString(parsed.activeInstructions)
    currentTemplateId.value = asNullableString(parsed.currentTemplateId)
  }

  function undo() {
    if (isSimulating.value) {
      resetSimulation()
    }
    if (history.value.length === 0) return
    const lastSnapshot = history.value.pop()
    if (lastSnapshot) {
      restoreHistory(lastSnapshot)
      syncToUrl()
    }
  }

  function initBoard(size: number, sync = true, recordHistory = true) {
    if (isSimulating.value) {
      resetSimulation()
    }
    if (recordHistory && gridData.value.length > 0) {
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

  function loadTemplate(
    size: GridSize,
    mainCells: CompactCell[],
    secCells: CompactCell[],
    instructions: string | null = null,
    id: string | null = null,
  ) {
    saveHistory()
    currentTemplateId.value = id

    // Map instructions dynamically using translation key if translation available
    if (id) {
      const key = `tpl_${id}_instr` as keyof typeof t.value
      activeInstructions.value = (t.value[key] as string) || instructions
    } else {
      activeInstructions.value = instructions
    }

    initBoard(size, false, false)
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
      // Enforce single-placement of Robot ('Bot') and Goal ('BatteryCharging') on the top grid
      if (!isSecondary && (tool.value === 'Bot' || tool.value === 'BatteryCharging')) {
        for (let r = 0; r < gridSize.value; r++) {
          const gridRow = gridData.value[r]
          if (gridRow) {
            for (let c = 0; c < gridSize.value; c++) {
              const gridCell = gridRow[c]
              if (gridCell && gridCell.icon === tool.value) {
                gridCell.icon = null
              }
            }
          }
        }
      }
      cell.icon = tool.value
      cell.text = null
    } else if (tool.type === 'text') {
      cell.text = tool.value
      cell.icon = null
    }

    // Play micro drawing sound effect!
    playDraw(soundEnabled.value)

    syncToUrlDebounced()
  }

  function getCoordinatesText() {
    const coords: Record<string, string[]> = {}

    const extractCoords = (grid: GridCell[][]) => {
      for (const row of grid) {
        for (const cell of row) {
          if (cell.bg) {
            const key = lang.value === 'pl' ? `Tło: ${cell.bg}` : `Background: ${cell.bg}`
            if (!coords[key]) coords[key] = []
            coords[key].push(cell.id)
          }
          if (cell.icon && !(cell.id === 'S1-1' && cell.icon === START_ICON)) {
            const key = lang.value === 'pl' ? `Ikona: ${cell.icon}` : `Icon: ${cell.icon}`
            if (!coords[key]) coords[key] = []
            coords[key].push(cell.id)
          }
          if (cell.text) {
            const key = lang.value === 'pl' ? `Tekst: ${cell.text}` : `Text: ${cell.text}`
            if (!coords[key]) coords[key] = []
            coords[key].push(cell.id)
          }
        }
      }
    }

    extractCoords(gridData.value)
    extractCoords(secondaryGridData.value)

    if (Object.keys(coords).length === 0) {
      return t.value.emptyBoardAlert
    }

    let result = `${t.value.exportTitle}\n==============================\n${t.value.size} ${gridSize.value}x${gridSize.value}\n\n`
    for (const [key, values] of Object.entries(coords)) {
      result += `${key}\n=> ${values.join(', ')}\n\n`
    }
    return result
  }

  function importCoordinatesText(text: string) {
    const parsed = parseCoordinateImport(text)
    if (!parsed) return false

    if (isSimulating.value) {
      resetSimulation()
    }

    saveHistory()
    activeInstructions.value = null
    currentTemplateId.value = null
    initBoard(parsed.size, false, false)
    applyCompactCells(parsed.main, gridData.value)
    applyCompactCells(parsed.secondary, secondaryGridData.value)

    const startCell = secondaryGridData.value[0]?.[0]
    if (startCell) startCell.icon = START_ICON

    syncToUrl()
    return true
  }

  function getDirectionAngle(dir: 'UP' | 'RIGHT' | 'DOWN' | 'LEFT'): number {
    switch (dir) {
      case 'UP':
        return 0
      case 'RIGHT':
        return 90
      case 'DOWN':
        return 180
      case 'LEFT':
        return 270
    }
  }

  function nextDirection(
    current: 'UP' | 'RIGHT' | 'DOWN' | 'LEFT',
    rotation: 1 | -1,
  ): 'UP' | 'RIGHT' | 'DOWN' | 'LEFT' {
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
    let lastAction:
      | 'MOVE_UP'
      | 'MOVE_DOWN'
      | 'MOVE_RIGHT'
      | 'MOVE_LEFT'
      | 'TURN_RIGHT'
      | 'TURN_LEFT'
      | null = null
    let lastSourceCell: { r: number; c: number } | null = null

    for (const item of rawList) {
      let action:
        | 'MOVE_UP'
        | 'MOVE_DOWN'
        | 'MOVE_RIGHT'
        | 'MOVE_LEFT'
        | 'TURN_RIGHT'
        | 'TURN_LEFT'
        | null = null

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
      'Bot',
      'Ship',
      'Car',
      'TrainFront',
      'Plane',
      'Tractor',
      'Bus',
      'Bike',
      'Cat',
      'Dog',
      'Bird',
      'Rabbit',
      'Snail',
      'Bug',
      'Fish',
      'Turtle',
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

    // Save pre-simulation grid state snapshot
    preSimGridData.value = JSON.parse(JSON.stringify(gridData.value))
    simulationInventory.value = []

    // 1. Find starting robot / character
    let startChar = findStartingCharacter()

    // If no character found, try to locate a sensible default
    if (!startChar) {
      // Check templates default starting points
      const hasGoalJ10 = gridData.value[9]?.[9]?.icon === 'BatteryCharging'
      const hasGoalJ1 = gridData.value[0]?.[9]?.icon === 'BatteryCharging'

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
      icon: startChar.icon,
    }
    isSimulating.value = true
    simulationStep.value = 0
    simulationStatus.value = 'running'
    simulationActiveInstructionId.value = null
    simulationPathHistory.value = [{ r: startChar.r, c: startChar.c }]

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
    if (preSimGridData.value) {
      gridData.value = preSimGridData.value
      preSimGridData.value = null
    }
    simulationInventory.value = []
    isSimulating.value = false
    simulationStep.value = 0
    simulationStatus.value = 'ready'
    simulationRobot.value = null
    simulationActiveInstructionId.value = null
    simulationSteps.value = []
    simulationPathHistory.value = []
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
    return cell.icon === 'BatteryCharging' || cell.bg === '#eab308'
  }

  function isObstacleCell(r: number, c: number): boolean {
    const cell = gridData.value[r]?.[c]
    if (!cell) return false
    if (isSuccessCell(r, c)) return false
    return cell.bg !== null
  }

  function nextSimulationStep() {
    if (!isSimulating.value || !simulationRobot.value) return

    // If we finished all steps, check for final status
    if (simulationStep.value >= simulationSteps.value.length) {
      stopTimer()
      const robot = simulationRobot.value
      if (isSuccessCell(robot.r, robot.c)) {
        simulationStatus.value = 'success'
        playSuccess(soundEnabled.value)
      } else {
        simulationStatus.value = 'ready'
      }
      simulationActiveInstructionId.value = null
      return
    }

    const step = simulationSteps.value[simulationStep.value]!
    simulationActiveInstructionId.value = `S${step.sourceCell.r + 1}-${step.sourceCell.c + 1}`

    const robot = simulationRobot.value

    // play step sound!
    playStep(soundEnabled.value)

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
      } else if (step.action === 'MOVE_DOWN') {
        nextR += 1
      } else if (step.action === 'MOVE_RIGHT') {
        nextC += 1
      } else if (step.action === 'MOVE_LEFT') {
        nextC -= 1
      }

      // Verify out of bounds
      if (nextR < 0 || nextR >= gridSize.value || nextC < 0 || nextC >= gridSize.value) {
        simulationStatus.value = 'out_of_bounds'
        stopTimer()
        simulationActiveInstructionId.value = null
        playCollision(soundEnabled.value)
        return
      }

      // Verify collision
      if (isObstacleCell(nextR, nextC)) {
        simulationStatus.value = 'collision'
        stopTimer()
        simulationActiveInstructionId.value = null
        playCollision(soundEnabled.value)
        return
      }

      robot.r = nextR
      robot.c = nextC
      simulationPathHistory.value.push({ r: nextR, c: nextC })

      // Pick up symbol on cell (except success/goal and robot's own start icon)
      const nextCell = gridData.value[nextR]?.[nextC]
      if (nextCell && !isSuccessCell(nextR, nextC)) {
        if (nextCell.icon && nextCell.icon !== robot.icon) {
          simulationInventory.value.push({ type: 'icon', value: nextCell.icon })
          nextCell.icon = null
        }
        if (nextCell.text) {
          simulationInventory.value.push({ type: 'text', value: nextCell.text })
          nextCell.text = null
        }
      }
    }

    // Increment step counter
    simulationStep.value += 1

    // Check if we hit success at this step
    if (isSuccessCell(robot.r, robot.c)) {
      simulationStatus.value = 'success'
      stopTimer()
      simulationActiveInstructionId.value = null
      playSuccess(soundEnabled.value)
      return
    }

    // Check if that was the last step and we are not on success
    if (simulationStep.value === simulationSteps.value.length) {
      stopTimer()
      if (isSuccessCell(robot.r, robot.c)) {
        simulationStatus.value = 'success'
        playSuccess(soundEnabled.value)
      } else {
        simulationStatus.value = 'ready'
      }
      simulationActiveInstructionId.value = null
    }
  }

  // Initialize on store creation
  if (!loadFromUrl()) {
    initBoard(gridSize.value, false, false)
  }

  // Clear initial history state added by initBoard on load
  history.value = []

  // Ensure appropriate theme class is active on startup
  applyThemeClass()

  return {
    lang,
    isDarkMode,
    soundEnabled,
    t,
    toggleLanguage,
    toggleTheme,
    toggleSound,
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
    importCoordinatesText,
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
    simulationPathHistory,
    simulationInventory,
  }
})
