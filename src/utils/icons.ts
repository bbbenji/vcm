import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  EvCharger,
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
  Square,
  Tractor,
  TrainFront,
  Turtle,
  Type,
  PartyPopper,
  Zap,
  Compass,
} from "lucide-vue-next";
import { h } from "vue";
import type { Component } from "vue";

const createSvgIcon = (svgContent: string): Component => ({
  name: "CustomSvgIcon",
  render() {
    return h(
      "svg",
      {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        width: 24,
        height: 24,
      },
      [h("g", { innerHTML: svgContent })],
    );
  },
});

const createTextIcon = (text: string): Component => ({
  name: "CustomTextIcon",
  render() {
    return h(
      "span",
      {
        class:
          "text-sm sm:text-base md:text-xl lg:text-2xl font-bold select-none text-slate-800 dark:text-slate-100 flex justify-center items-center w-full h-full leading-none",
      },
      text,
    );
  },
});

const F1Icon = createSvgIcon(
  '<text x="2" y="17.5" font-family="sans-serif" font-size="16" font-weight="bold" fill="currentColor" stroke="none">F</text><text x="13" y="21" font-family="sans-serif" font-size="10" font-weight="bold" fill="currentColor" stroke="none">1</text>',
);
const F2Icon = createSvgIcon(
  '<text x="2" y="17.5" font-family="sans-serif" font-size="16" font-weight="bold" fill="currentColor" stroke="none">F</text><text x="13" y="21" font-family="sans-serif" font-size="10" font-weight="bold" fill="currentColor" stroke="none">2</text>',
);
const LoopPlayIcon = createSvgIcon(
  '<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-1.19"/><path d="M10 8.5l5 3.5-5 3.5v-7z" fill="none" stroke="currentColor"/>',
);
const LoopStopIcon = createSvgIcon(
  '<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-1.19"/><rect x="9.5" y="9.5" width="5" height="5" rx="0.5" fill="none" stroke="currentColor"/>',
);

const Num2Icon = createTextIcon("2");
const Num3Icon = createTextIcon("3");
const Num4Icon = createTextIcon("4");
const Num5Icon = createTextIcon("5");
const Num6Icon = createTextIcon("6");

const icons = {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  EvCharger,
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
  PartyPopper,
  Zap,
  Compass,
  PlayFilled: Play,
  StopFilled: Square,
  F1Icon,
  F2Icon,
  LoopPlayIcon,
  LoopStopIcon,
  Num2Icon,
  Num3Icon,
  Num4Icon,
  Num5Icon,
  Num6Icon,
} satisfies Record<string, Component>;

export type IconName = keyof typeof icons;

export function getIcon(name: string) {
  return icons[name as IconName] ?? HelpCircle;
}

export function getPlacedIcon(name: string) {
  return icons[name as IconName] ?? null;
}
