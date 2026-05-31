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
