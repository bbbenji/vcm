<script setup lang="ts">
import { ref } from "vue";
import { useMatStore } from "../stores/matStore";
import type { ToolType } from "../stores/matStore";
import { getIcon } from "../utils/icons";

const store = useMatStore();
const toolButtonClass =
  "w-full aspect-square rounded-lg border-2 flex justify-center items-center text-xl font-bold bg-white text-slate-800 transition-all shadow-sm hover:scale-105 hover:shadow-md border-slate-200 cursor-pointer";
const selectedToolClass = "!border-primary scale-110 shadow-[0_0_0_2px_rgba(59,130,246,0.3)]";

const colors = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#000000",
  "#475569",
  "#ffffff",
];
const movements = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "RotateCcw",
  "RotateCw",
  "CornerUpLeft",
  "CornerUpRight",
];
const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "-", "=", "<", ">"];
const alphabet = "AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ?!.".split("");
const vehicles = [
  "Car",
  "Rocket",
  "TrainFront",
  "Ship",
  "Plane",
  "Tractor",
  "Bus",
  "Bike",
  "Gamepad2",
  "Puzzle",
  "Bot",
];
const animals = ["Cat", "Dog", "Bird", "Rabbit", "Snail", "Bug", "Fish", "Turtle"];

const categories = [
  { id: "bg", name: "Kolory", icon: "Palette", toolType: "background", items: colors },
  { id: "move", name: "Ruch", icon: "Move", toolType: "icon", items: movements },
  { id: "num", name: "Cyfry", icon: "Binary", toolType: "text", items: numbers },
  { id: "abc", name: "Alfabet", icon: "Type", toolType: "text", items: alphabet },
  { id: "veh", name: "Pojazdy i Zabawki", icon: "Car", toolType: "icon", items: vehicles },
  { id: "ani", name: "Zwierzęta", icon: "Cat", toolType: "icon", items: animals },
];

const activeTab = ref("bg");

const selectTool = (type: ToolType, value: string | null) => {
  store.activeTool = { type, value };
};
</script>

<template>
  <aside
    class="flex flex-col bg-white border-t md:border-t-0 md:border-l border-slate-200 w-full md:w-[320px] h-[240px] md:h-full overflow-hidden shrink-0"
  >
    <div class="flex flex-row overflow-x-auto whitespace-nowrap p-2 gap-1 border-b border-slate-200 bg-slate-100 scrollbar-none">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 cursor-pointer shrink-0 min-w-[70px] md:min-w-0 md:flex-1"
        :class="{ 'bg-white text-primary shadow-sm font-semibold': activeTab === cat.id }"
        @click="activeTab = cat.id"
        :title="cat.name"
      >
        <component :is="getIcon(cat.icon)" :size="18" class="md:w-5 md:h-5" />
        <span class="text-[0.65rem] md:text-[0.7rem] text-center">{{ cat.name }}</span>
      </button>
    </div>

    <div class="p-3 md:p-6 flex-1 overflow-y-auto">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] md:grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-2 md:gap-3">
        <!-- Special eraser button -->
        <button
          class="w-full aspect-square rounded-lg border-2 flex justify-center items-center text-xl font-bold bg-white text-slate-800 transition-all shadow-sm hover:scale-105 hover:shadow-md border-dashed border-slate-400 cursor-pointer"
          @click="selectTool('eraser', null)"
          :class="{
            [`!border-solid ${selectedToolClass}`]: store.activeTool.type === 'eraser',
          }"
          title="Gumka"
        >
          <component :is="getIcon('Eraser')" />
        </button>

        <template v-for="cat in categories" :key="'grid-' + cat.id">
          <template v-if="activeTab === cat.id">
            <button
              v-for="item in cat.items"
              :key="item"
              :class="[
                cat.toolType === 'background'
                  ? 'w-full aspect-square rounded-lg border-2 flex justify-center items-center text-xl font-bold bg-slate-50 text-slate-800 transition-all shadow-sm hover:scale-105 hover:shadow-md border-black/10 cursor-pointer'
                  : toolButtonClass,
                {
                  [selectedToolClass]:
                    store.activeTool.type === cat.toolType && store.activeTool.value === item,
                },
              ]"
              :style="cat.toolType === 'background' ? { backgroundColor: item } : {}"
              @click="selectTool(cat.toolType as ToolType, item)"
            >
              <component v-if="cat.toolType === 'icon'" :is="getIcon(item)" />
              <template v-else-if="cat.toolType === 'text'">{{ item }}</template>
            </button>
          </template>
        </template>
      </div>
    </div>
  </aside>
</template>
