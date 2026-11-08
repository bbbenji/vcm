import type { GridSize } from '../stores/matStore'
import { heart } from './templates/heart'
import { rocket } from './templates/rocket'
import { flower } from './templates/flower'
import { house } from './templates/house'
import { maze1 } from './templates/maze1'
import { pirate_maze } from './templates/pirate_maze'
import { coded_heart } from './templates/coded_heart'
import { butterfly_symmetry } from './templates/butterfly_symmetry'
import { castle } from './templates/castle'
import { island_maze } from './templates/island_maze'
import { shield_symmetry } from './templates/shield_symmetry'
import { digital_robot } from './templates/digital_robot'
import { fish } from './templates/fish'
import { cat } from './templates/cat'
import { tree } from './templates/tree'
import { star } from './templates/star'
import { ladybug } from './templates/ladybug'
import { mushroom } from './templates/mushroom'
import { sailboat } from './templates/sailboat'
import { rainbow } from './templates/rainbow'
import { space_labyrinth } from './templates/space_labyrinth'

export interface Template {
  id: string
  size: GridSize
  type: 'premade' | 'instruction'
  category: 'pixel_art' | 'algorithm' | 'math_symmetry'
  main: [number, number, string | null, string | null, string | null][]
  secondary: [number, number, string | null, string | null, string | null][]
  mainSolution?: [number, number, string | null, string | null, string | null][]
  secondarySolution?: [number, number, string | null, string | null, string | null][]
}

/**
 * Whether a design can be reproduced on the Pixel Taca tray: a 16.5cm product
 * with 10x10 fields of 15mm, so only a 10x10 board fits, and only colours can
 * be laid down in coloured water or loose material. Derived rather than listed
 * by hand, so a design added later is offered only if it really fits.
 */
export function isTrayDesign(t: Template) {
  return (
    t.size === 10 &&
    t.type === 'premade' &&
    t.category === 'pixel_art' &&
    t.secondary.length === 0 &&
    t.main.length > 0 &&
    t.main.every(([, , bg, icon, text]) => Boolean(bg) && icon === null && text === null)
  )
}

export const templates: Template[] = [
  // Pixel Art & Patterns - the 10x10 ones fit the Pixel Taca tray
  heart,
  fish,
  cat,
  tree,
  star,
  ladybug,
  mushroom,
  sailboat,
  rainbow,
  rocket,
  flower,
  house,

  // Pixel art too big for the tray
  castle,
  digital_robot,

  // Movement & Algorithms
  maze1,
  pirate_maze,
  island_maze,
  space_labyrinth,

  // Symmetry & Math
  coded_heart,
  butterfly_symmetry,
  shield_symmetry,
]

/** The shipped designs that can be copied onto the tray. */
export const trayDesigns: Template[] = templates.filter(isTrayDesign)
