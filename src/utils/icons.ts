import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bike,
  Binary,
  Bird,
  Bot,
  Bug,
  Bus,
  Car,
  Cat,
  CornerUpLeft,
  CornerUpRight,
  Dog,
  Eraser,
  Fish,
  Gamepad2,
  HelpCircle,
  Move,
  Palette,
  Plane,
  Play,
  Puzzle,
  Rabbit,
  Rocket,
  RotateCcw,
  RotateCw,
  Ship,
  Snail,
  Tractor,
  TrainFront,
  Turtle,
  Type,
} from 'lucide-vue-next'
import type { LucideIcon } from 'lucide-vue-next'

const icons = {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bike,
  Binary,
  Bird,
  Bot,
  Bug,
  Bus,
  Car,
  Cat,
  CornerUpLeft,
  CornerUpRight,
  Dog,
  Eraser,
  Fish,
  Gamepad2,
  HelpCircle,
  Move,
  Palette,
  Plane,
  Play,
  Puzzle,
  Rabbit,
  Rocket,
  RotateCcw,
  RotateCw,
  Ship,
  Snail,
  Tractor,
  TrainFront,
  Turtle,
  Type,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof icons

export function getIcon(name: string) {
  return icons[name as IconName] ?? HelpCircle
}

export function getPlacedIcon(name: string) {
  return icons[name as IconName] ?? null
}
