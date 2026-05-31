import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMatStore } from './matStore'
import { templates } from '../utils/templates'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function installBrowserStubs(hash = '') {
  const location = {
    pathname: '/',
    search: '',
    hash,
  }

  const replaceState = vi.fn((_state: unknown, _title: string, url?: string | URL | null) => {
    if (url == null) return

    const nextUrl = String(url)
    const hashIndex = nextUrl.indexOf('#')
    location.hash = hashIndex === -1 ? '' : nextUrl.slice(hashIndex)
  })

  vi.stubGlobal('localStorage', new MemoryStorage())
  vi.stubGlobal('window', {
    location,
    history: { replaceState },
  })
  vi.stubGlobal('document', {
    documentElement: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    },
  })
}

function templateById(id: string) {
  const template = templates.find((item) => item.id === id)
  if (!template) throw new Error(`Missing test template: ${id}`)
  return template
}

describe('matStore undo history', () => {
  beforeEach(() => {
    installBrowserStubs()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('records a single undo point when loading a template', () => {
    const store = useMatStore()
    const template = templateById('heart')
    const previousCell = store.gridData[0]?.[0]

    if (!previousCell) throw new Error('Expected initialized grid')
    previousCell.bg = '#3b82f6'
    store.activeInstructions = 'manual task'
    store.currentTemplateId = null
    store.history.splice(0)

    store.loadTemplate(
      template.size,
      template.main,
      template.secondary,
      template.instructions ?? null,
      template.id,
    )

    expect(store.history).toHaveLength(1)
    expect(store.currentTemplateId).toBe('heart')
    expect(store.gridData[2]?.[2]?.bg).toBe('#ef4444')

    store.undo()

    expect(store.history).toHaveLength(0)
    expect(store.gridData[0]?.[0]?.bg).toBe('#3b82f6')
    expect(store.gridData[2]?.[2]?.bg).toBeNull()
    expect(store.activeInstructions).toBe('manual task')
    expect(store.currentTemplateId).toBeNull()
  })

  it('restores template instructions after undoing a clear', () => {
    const store = useMatStore()
    const template = templateById('maze1')

    store.loadTemplate(
      template.size,
      template.main,
      template.secondary,
      template.instructions ?? null,
      template.id,
    )
    store.history.splice(0)

    store.clearBoard()

    expect(store.currentTemplateId).toBeNull()
    expect(store.activeInstructions).toBeNull()
    expect(store.gridData[0]?.[0]?.icon).toBeNull()

    store.undo()

    expect(store.currentTemplateId).toBe('maze1')
    expect(store.activeInstructions).toBe(store.t.tpl_maze1_instr)
    expect(store.hasSolution).toBe(true)
    expect(store.gridData[0]?.[0]?.icon).toBe('Bot')
  })

  it('undoes generated solutions without losing the active task', () => {
    const store = useMatStore()
    const template = templateById('coded_heart')

    store.loadTemplate(
      template.size,
      template.main,
      template.secondary,
      template.instructions ?? null,
      template.id,
    )
    store.history.splice(0)

    store.showSolution()

    expect(store.gridData[1]?.[2]?.bg).toBe('#ef4444')
    expect(store.currentTemplateId).toBe('coded_heart')

    store.undo()

    expect(store.gridData[1]?.[2]?.bg).toBeNull()
    expect(store.currentTemplateId).toBe('coded_heart')
    expect(store.activeInstructions).toBe(store.t.tpl_coded_heart_instr)
    expect(store.hasSolution).toBe(true)
  })
})

describe('matStore coordinate import', () => {
  beforeEach(() => {
    installBrowserStubs()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('imports a coordinates export and keeps the import undoable', () => {
    const store = useMatStore()

    const backgroundCell = store.gridData[0]?.[0]
    const iconCell = store.gridData[1]?.[1]
    const textCell = store.gridData[2]?.[2]
    const instructionCell = store.secondaryGridData[0]?.[1]

    if (!backgroundCell || !iconCell || !textCell || !instructionCell) {
      throw new Error('Expected initialized grids')
    }

    backgroundCell.bg = '#ef4444'
    iconCell.bg = '#22c55e'
    iconCell.icon = 'Bot'
    textCell.text = 'A'
    instructionCell.icon = 'ArrowRight'

    const exportedText = store.getCoordinatesText()

    store.clearBoard()
    store.history.splice(0)

    expect(store.importCoordinatesText(exportedText)).toBe(true)

    expect(store.history).toHaveLength(1)
    expect(store.gridData[0]?.[0]?.bg).toBe('#ef4444')
    expect(store.gridData[1]?.[1]?.bg).toBe('#22c55e')
    expect(store.gridData[1]?.[1]?.icon).toBe('Bot')
    expect(store.gridData[2]?.[2]?.text).toBe('A')
    expect(store.secondaryGridData[0]?.[1]?.icon).toBe('ArrowRight')
    expect(store.currentTemplateId).toBeNull()
    expect(store.activeInstructions).toBeNull()

    store.undo()

    expect(store.gridData[0]?.[0]?.bg).toBeNull()
    expect(store.gridData[1]?.[1]?.bg).toBeNull()
    expect(store.gridData[1]?.[1]?.icon).toBeNull()
    expect(store.gridData[2]?.[2]?.text).toBeNull()
    expect(store.secondaryGridData[0]?.[1]?.icon).toBeNull()
  })

  it('infers the smallest supported grid size from imported coordinates', () => {
    const store = useMatStore()
    const coordinatesText = `Virtual Coding Mat Coordinates
==============================

Background: #22c55e
=> L12

Icon: ArrowRight
=> S1-12

Text: Z
=> C3
`

    expect(store.importCoordinatesText(coordinatesText)).toBe(true)

    expect(store.gridSize).toBe(12)
    expect(store.gridData[11]?.[11]?.bg).toBe('#22c55e')
    expect(store.secondaryGridData[0]?.[11]?.icon).toBe('ArrowRight')
    expect(store.gridData[2]?.[2]?.text).toBe('Z')
  })

  it('preserves the declared size from new coordinates exports', () => {
    const store = useMatStore()

    store.initBoard(16)
    store.history.splice(0)

    const cell = store.gridData[0]?.[0]
    if (!cell) throw new Error('Expected initialized grid')
    cell.bg = '#3b82f6'

    const exportedText = store.getCoordinatesText()

    store.initBoard(10)
    store.history.splice(0)

    expect(store.importCoordinatesText(exportedText)).toBe(true)

    expect(store.gridSize).toBe(16)
    expect(store.gridData[0]?.[0]?.bg).toBe('#3b82f6')
  })

  it('rejects text without importable coordinates', () => {
    const store = useMatStore()

    expect(store.importCoordinatesText(store.t.emptyBoardAlert)).toBe(false)

    expect(store.history).toHaveLength(0)
    expect(store.gridSize).toBe(10)
  })
})
