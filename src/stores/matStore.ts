import { defineStore } from 'pinia'
import { ref } from 'vue'

export const GRID_SIZES = [10, 12, 14, 16, 18, 20] as const

export type ToolType = 'background' | 'icon' | 'text' | 'eraser'
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

export const useMatStore = defineStore('mat', () => {
  const gridSize = ref<GridSize>(DEFAULT_GRID_SIZE)
  const activeTool = ref<ActiveTool>({ type: 'background', value: '#3b82f6' }) // Default blue bg
  const gridData = ref<GridCell[][]>([])
  const secondaryGridData = ref<GridCell[][]>([])
  const history = ref<string[]>([])

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
    saveHistory()
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

  function updateCell(row: number, col: number, isSecondary = false) {
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
  }
})
