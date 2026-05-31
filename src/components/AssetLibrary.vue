<script setup lang="ts">
import { ref } from "vue";
import { useMatStore } from "../stores/matStore";
import type { ToolType } from "../stores/matStore";
import { getIcon } from "../utils/icons";
import { templates } from "../utils/templates";
import { Play, Pause, RotateCcw, Lightbulb, Turtle, Gauge, Zap } from "lucide-vue-next";

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
  "ArrowRight",
  "ArrowLeft",
  "CornerUpRight",
  "CornerUpLeft",
  "PlayFilled",
  "StopFilled",
  "F1Icon",
  "F2Icon",
  "LoopPlayIcon",
  "LoopStopIcon",
  "Num2Icon",
  "Num3Icon",
  "Num4Icon",
  "Num5Icon",
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
  { id: "bg", name: "Kolory", icon: "Palette", toolType: "background" as ToolType, items: colors },
  { id: "move", name: "Ruch", icon: "Move", toolType: "icon" as ToolType, items: movements },
  { id: "num", name: "Cyfry", icon: "Binary", toolType: "text" as ToolType, items: numbers },
  { id: "abc", name: "Alfabet", icon: "Type", toolType: "text" as ToolType, items: alphabet },
  { id: "veh", name: "Pojazdy", icon: "Car", toolType: "icon" as ToolType, items: vehicles },
  { id: "ani", name: "Zwierzęta", icon: "Cat", toolType: "icon" as ToolType, items: animals },
  { id: "tasks", name: "Zadania", icon: "BookOpen", toolType: "task" as ToolType, items: [] },
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
    <!-- Simulation Control Panel inside Sidebar -->
    <div 
      v-if="store.instructionsExist" 
      class="w-full border-b border-slate-200 bg-slate-50 p-2.5 select-none animate-fade-in flex flex-col gap-2 shrink-0"
    >
      <!-- Status row -->
      <div class="flex items-center gap-2">
        <div class="relative flex h-3 w-3 shrink-0">
          <span 
            class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            :class="{
              'bg-slate-400': store.simulationStatus === 'ready',
              'bg-blue-400': store.simulationStatus === 'running',
              'bg-emerald-400': store.simulationStatus === 'success',
              'bg-amber-400': store.simulationStatus === 'paused',
              'bg-rose-400': ['collision', 'out_of_bounds'].includes(store.simulationStatus),
            }"
          ></span>
          <span 
            class="relative inline-flex rounded-full h-3 w-3"
            :class="{
              'bg-slate-500': store.simulationStatus === 'ready',
              'bg-blue-500': store.simulationStatus === 'running',
              'bg-emerald-500': store.simulationStatus === 'success',
              'bg-amber-500': store.simulationStatus === 'paused',
              'bg-rose-500': ['collision', 'out_of_bounds'].includes(store.simulationStatus),
            }"
          ></span>
        </div>
        
        <div class="flex items-baseline gap-1.5 min-w-0">
          <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider select-none shrink-0 leading-none">Symulator:</span>
          <span class="text-xs font-semibold text-slate-700 truncate leading-none">
            <template v-if="store.simulationStatus === 'ready' && !store.isSimulating">Gotowy</template>
            <template v-else-if="store.simulationStatus === 'paused'">Wstrzymano</template>
            <template v-else-if="store.simulationStatus === 'running'">Krok {{ store.simulationStep }}/{{ store.simulationSteps.length }}</template>
            <template v-else-if="store.simulationStatus === 'success'">Sukces! 🎉</template>
            <template v-else-if="store.simulationStatus === 'collision'">Kraksa! 💥</template>
            <template v-else-if="store.simulationStatus === 'out_of_bounds'">Poza planszą! 🗺️</template>
            <template v-else-if="store.simulationStatus === 'ready' && store.isSimulating">Koniec</template>
          </span>
        </div>
      </div>

      <!-- Action buttons & speed dials row -->
      <div class="flex flex-row items-center justify-between gap-1.5">
        <!-- Main simulator controls -->
        <div class="flex items-center gap-1">
          <!-- Play / Pause Button -->
          <button 
            v-if="store.simulationStatus === 'paused' || store.simulationStatus === 'ready'"
            @click="store.simulationStatus === 'paused' ? store.resumeSimulation() : store.startSimulation()"
            class="flex items-center justify-center h-8 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0"
            :title="store.simulationStatus === 'paused' ? 'Wznów symulację' : 'Uruchom symulację'"
          >
            <Play :size="12" class="fill-current mr-1" />
            <span>{{ store.simulationStatus === 'paused' ? 'Wznów' : 'START' }}</span>
          </button>
          
          <button 
            v-else-if="store.simulationStatus === 'running'"
            @click="store.pauseSimulation()"
            class="flex items-center justify-center h-8 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm shadow-amber-500/20 active:scale-95 cursor-pointer shrink-0"
            title="Pauzuj symulację"
          >
            <Pause :size="12" class="fill-current mr-1" />
            <span>Pauza</span>
          </button>

          <!-- Reset Button -->
          <button 
            @click="store.resetSimulation()"
            class="flex items-center justify-center h-8 w-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
            title="Resetuj symulację"
          >
            <RotateCcw :size="13" />
          </button>

          <!-- Solution Solver Button -->
          <button 
            v-if="store.hasSolution"
            @click="store.showSolution()"
            class="flex items-center justify-center h-8 w-8 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-150/50 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
            title="Pokaż gotowe rozwiązanie"
          >
            <Lightbulb :size="13" />
          </button>
        </div>

        <!-- Speed selector -->
        <div class="flex items-center gap-1 pl-1.5 border-l border-slate-200/80">
          <button 
            @click="store.changeSpeed(1500)"
            class="h-7 w-7 rounded-md cursor-pointer flex items-center justify-center transition-colors"
            :class="store.simulationSpeed === 1500 ? 'bg-primary text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            title="Prędkość: Żółw (wolno)"
          >
            <Turtle :size="13" />
          </button>
          <button 
            @click="store.changeSpeed(800)"
            class="h-7 w-7 rounded-md cursor-pointer flex items-center justify-center transition-colors"
            :class="store.simulationSpeed === 800 ? 'bg-primary text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            title="Prędkość: Normalna"
          >
            <Gauge :size="13" />
          </button>
          <button 
            @click="store.changeSpeed(300)"
            class="h-7 w-7 rounded-md cursor-pointer flex items-center justify-center transition-colors"
            :class="store.simulationSpeed === 300 ? 'bg-primary text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            title="Prędkość: Zając (szybko)"
          >
            <Zap :size="13" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-row overflow-x-auto whitespace-nowrap p-2 gap-1 border-b border-slate-200 bg-slate-100 scrollbar-none">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="flex flex-col items-center justify-center gap-1 p-1 md:p-2 rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 cursor-pointer shrink-0 w-[78px] md:w-auto md:flex-1"
        :class="{ 'bg-white text-primary shadow-sm font-semibold': activeTab === cat.id }"
        @click="activeTab = cat.id"
        :title="cat.name"
      >
        <component :is="getIcon(cat.icon)" :size="18" class="md:w-5 md:h-5 shrink-0" />
        <span class="text-[0.6rem] md:text-[0.7rem] text-center whitespace-normal leading-tight break-words max-w-full font-medium">{{ cat.name }}</span>
      </button>
    </div>

    <div class="p-3 md:p-6 flex-1 overflow-y-auto">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] md:grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-2 md:gap-3">
        <!-- Special eraser button -->
        <button
          v-if="activeTab !== 'tasks'"
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

        <!-- Predefined and instructional templates lists -->
        <template v-if="activeTab === 'tasks'">
          <div class="flex flex-col gap-3 col-span-full pb-6">
            <button
              v-for="tpl in templates"
              :key="tpl.id"
              @click="store.loadTemplate(tpl.size, tpl.main, tpl.secondary, tpl.instructions || null, tpl.id)"
              class="flex flex-col text-left p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-sm select-none"
            >
              <div class="flex justify-between items-center w-full">
                <span class="font-bold text-slate-800 text-sm">{{ tpl.name }}</span>
                <span 
                  class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none shrink-0"
                  :class="tpl.type === 'premade' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'"
                >
                  {{ tpl.type === 'premade' ? 'Wzór' : 'Zadanie' }}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1 leading-normal break-words">{{ tpl.description }}</p>
              <span class="text-[10px] text-primary font-semibold mt-2.5 flex items-center gap-1">
                Uruchom planszę ({{ tpl.size }}x{{ tpl.size }}) &rarr;
              </span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </aside>
</template>
