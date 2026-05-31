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
import { space_labyrinth } from './templates/space_labyrinth'

export interface Template {
  id: string
  name: string
  description: string
  size: GridSize
  type: 'premade' | 'instruction'
  category: 'pixel_art' | 'algorithm' | 'math_symmetry'
  instructions?: string
  main: [number, number, string | null, string | null, string | null][]
  secondary: [number, number, string | null, string | null, string | null][]
  mainSolution?: [number, number, string | null, string | null, string | null][]
  secondarySolution?: [number, number, string | null, string | null, string | null][]
}

export const templates: Template[] = [
  // Pixel Art & Patterns
  heart,
  rocket,
  flower,
  house,
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
