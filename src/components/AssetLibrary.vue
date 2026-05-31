<script setup lang="ts">
import { ref } from "vue";
import { useMatStore } from "../stores/matStore";
import type { ToolType } from "../stores/matStore";
import { getIcon } from "../utils/icons";
import { templates } from "../utils/templates";
import {
  Play,
  Pause,
  RotateCcw,
  Lightbulb,
  Turtle,
  Gauge,
  Zap,
  ChevronUp,
  ChevronDown,
} from "lucide-vue-next";

const store = useMatStore();
const toolButtonClass =
  "w-full aspect-square rounded-lg border-2 flex justify-center items-center text-xl font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all shadow-sm hover:scale-105 hover:shadow-md border-slate-200 dark:border-slate-700/80 cursor-pointer";
const selectedToolClass =
  "!border-primary dark:!border-primary scale-110 shadow-[0_0_0_3px_rgba(99,102,241,0.35)] dark:shadow-[0_0_0_3px_rgba(99,102,241,0.5)]";

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
  { id: "bg" as const, icon: "Palette", toolType: "background" as ToolType, items: colors },
  { id: "move" as const, icon: "Move", toolType: "icon" as ToolType, items: movements },
  { id: "num" as const, icon: "Binary", toolType: "text" as ToolType, items: numbers },
  { id: "abc" as const, icon: "Type", toolType: "text" as ToolType, items: alphabet },
  { id: "veh" as const, icon: "Car", toolType: "icon" as ToolType, items: vehicles },
  { id: "ani" as const, icon: "Cat", toolType: "icon" as ToolType, items: animals },
  { id: "tasks" as const, icon: "BookOpen", toolType: "task" as ToolType, items: [] as string[] },
];

const activeTab = ref<(typeof categories)[number]["id"]>("bg");
const isCollapsed = ref(false);

const selectTool = (type: ToolType, value: string | null) => {
  store.activeTool = { type, value };
};

const selectTab = (tabId: (typeof categories)[number]["id"]) => {
  activeTab.value = tabId;
  isCollapsed.value = false;
};

// Helpers for template localization
const getTemplateName = (tpl: (typeof templates)[number]) => {
  const key = `tpl_${tpl.id}_name` as keyof typeof store.t;
  return (store.t[key] as string) || tpl.name;
};

const getTemplateDesc = (tpl: (typeof templates)[number]) => {
  const key = `tpl_${tpl.id}_desc` as keyof typeof store.t;
  return (store.t[key] as string) || tpl.description;
};
</script>

<template>
  <aside
    class="flex flex-col bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 w-full md:w-[330px] md:h-full overflow-hidden shrink-0 transition-all duration-300 ease-in-out shadow-lg"
    :class="isCollapsed ? 'h-7' : 'h-[320px] md:h-full'"
  >
    <!-- Collapsible drawer slider button for mobile devices -->
    <button
      class="md:hidden h-7 w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer select-none shrink-0"
      @click="isCollapsed = !isCollapsed"
      :aria-expanded="!isCollapsed"
    >
      <div
        class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-[10px] tracking-wider uppercase"
      >
        <component
          :is="isCollapsed ? ChevronUp : ChevronDown"
          :size="14"
          class="text-slate-400 dark:text-slate-500"
        />
        <span>{{ isCollapsed ? store.t.menuExpand : store.t.menuCollapse }}</span>
      </div>
    </button>

    <!-- Simulation Control Panel in Sidebar -->
    <div
      v-if="store.instructionsExist"
      class="w-full border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-3 select-none animate-fade-in flex flex-col gap-2.5 shrink-0"
    >
      <!-- Simulation Status -->
      <div class="flex items-center gap-2">
        <div class="relative flex h-2.5 w-2.5 shrink-0">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            :class="{
              'bg-slate-400': store.simulationStatus === 'ready',
              'bg-indigo-400': store.simulationStatus === 'running',
              'bg-emerald-400': store.simulationStatus === 'success',
              'bg-amber-400': store.simulationStatus === 'paused',
              'bg-rose-400': ['collision', 'out_of_bounds'].includes(store.simulationStatus),
            }"
          ></span>
          <span
            class="relative inline-flex rounded-full h-2.5 w-2.5"
            :class="{
              'bg-slate-500': store.simulationStatus === 'ready',
              'bg-indigo-500': store.simulationStatus === 'running',
              'bg-emerald-500': store.simulationStatus === 'success',
              'bg-amber-500': store.simulationStatus === 'paused',
              'bg-rose-500': ['collision', 'out_of_bounds'].includes(store.simulationStatus),
            }"
          ></span>
        </div>

        <div class="flex items-baseline gap-1.5 min-w-0">
          <span
            class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider select-none shrink-0 leading-none"
          >
            {{ store.t.simulator }}
          </span>
          <span class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-none">
            <template v-if="store.simulationStatus === 'ready' && !store.isSimulating">{{
              store.t.simReady
            }}</template>
            <template v-else-if="store.simulationStatus === 'paused'">{{
              store.t.simPaused
            }}</template>
            <template v-else-if="store.simulationStatus === 'running'"
              >{{ store.t.simStep }} {{ store.simulationStep }}/{{
                store.simulationSteps.length
              }}</template
            >
            <template v-else-if="store.simulationStatus === 'success'">{{
              store.t.simSuccess
            }}</template>
            <template v-else-if="store.simulationStatus === 'collision'">{{
              store.t.simCollision
            }}</template>
            <template v-else-if="store.simulationStatus === 'out_of_bounds'">{{
              store.t.simOutOfBounds
            }}</template>
            <template v-else-if="store.simulationStatus === 'ready' && store.isSimulating">{{
              store.t.simEnd
            }}</template>
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
            @click="
              store.simulationStatus === 'paused'
                ? store.resumeSimulation()
                : store.startSimulation()
            "
            class="flex items-center justify-center h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm shadow-emerald-500/10"
            :title="store.simulationStatus === 'paused' ? store.t.simResume : store.t.simStart"
          >
            <Play :size="12" class="fill-current mr-1" />
            <span>{{
              store.simulationStatus === "paused" ? store.t.simResume : store.t.simStart
            }}</span>
          </button>

          <button
            v-else-if="store.simulationStatus === 'running'"
            @click="store.pauseSimulation()"
            class="flex items-center justify-center h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm shadow-amber-500/10"
            :title="store.t.simPause"
          >
            <Pause :size="12" class="fill-current mr-1" />
            <span>{{ store.t.simPause }}</span>
          </button>

          <!-- Reset Button -->
          <button
            @click="store.resetSimulation()"
            class="flex items-center justify-center h-8 w-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/20"
            :title="store.t.simResetTitle"
          >
            <RotateCcw :size="13" />
          </button>

          <!-- Solution Solver Button -->
          <button
            v-if="store.hasSolution"
            @click="store.showSolution()"
            class="flex items-center justify-center h-8 w-8 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-primary dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/40 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
            :title="store.t.simSolutionTitle"
          >
            <Lightbulb :size="13" />
          </button>
        </div>

        <!-- Speed selector -->
        <div class="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
          <button
            @click="store.changeSpeed(1500)"
            class="h-7 w-7 rounded-md cursor-pointer flex items-center justify-center transition-colors"
            :class="
              store.simulationSpeed === 1500
                ? 'bg-primary text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            "
            :title="store.t.speedSlow"
          >
            <Turtle :size="13" />
          </button>
          <button
            @click="store.changeSpeed(800)"
            class="h-7 w-7 rounded-md cursor-pointer flex items-center justify-center transition-colors"
            :class="
              store.simulationSpeed === 800
                ? 'bg-primary text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            "
            :title="store.t.speedNormal"
          >
            <Gauge :size="13" />
          </button>
          <button
            @click="store.changeSpeed(300)"
            class="h-7 w-7 rounded-md cursor-pointer flex items-center justify-center transition-colors"
            :class="
              store.simulationSpeed === 300
                ? 'bg-primary text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            "
            :title="store.t.speedFast"
          >
            <Zap :size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- Category Tabs Selector -->
    <div
      class="flex flex-row overflow-x-auto whitespace-nowrap p-2 gap-1 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 scrollbar-none shrink-0"
    >
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="flex flex-col items-center justify-center gap-1 p-1 md:p-2 rounded-lg text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200/70 dark:hover:bg-slate-800/70 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer shrink-0 w-[74px] md:w-auto md:flex-1"
        :class="{
          'bg-white dark:bg-slate-800 text-primary dark:text-primary shadow-sm font-bold border border-slate-100 dark:border-slate-700/30':
            activeTab === cat.id,
        }"
        @click="selectTab(cat.id)"
        :title="store.t[cat.id as keyof typeof store.t] || cat.id"
      >
        <component :is="getIcon(cat.icon)" :size="18" class="md:w-5 md:h-5 shrink-0" />
        <span
          class="text-[0.62rem] md:text-[0.7rem] text-center whitespace-normal leading-tight break-words max-w-full font-medium"
        >
          {{ store.t[cat.id as keyof typeof store.t] }}
        </span>
      </button>
    </div>

    <!-- Assets / Tasks Drawer Panels -->
    <div
      class="py-3 px-3 md:p-5 flex-1 overflow-y-auto bg-white dark:bg-slate-900 transition-colors duration-300"
    >
      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] md:grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-2.5"
      >
        <!-- Special eraser button (available in all item lists) -->
        <button
          v-if="activeTab !== 'tasks'"
          class="w-full aspect-square rounded-lg border-2 flex justify-center items-center text-xl font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all shadow-sm hover:scale-105 hover:shadow-md border-dashed border-slate-400 dark:border-slate-600 cursor-pointer"
          @click="selectTool('eraser', null)"
          :class="{
            [`!border-solid ${selectedToolClass}`]: store.activeTool.type === 'eraser',
          }"
          :title="store.t.eraser"
        >
          <component
            :is="getIcon('Eraser')"
            class="text-rose-500 dark:text-rose-400 w-5 h-5 md:w-6 md:h-6"
          />
        </button>

        <!-- Dynamic Category Items -->
        <template v-for="cat in categories" :key="'grid-' + cat.id">
          <template v-if="activeTab === cat.id">
            <button
              v-for="item in cat.items"
              :key="item"
              :class="[
                cat.toolType === 'background'
                  ? 'w-full aspect-square rounded-lg border flex justify-center items-center text-xl font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all shadow-sm hover:scale-105 hover:shadow-md border-black/10 dark:border-white/10 cursor-pointer'
                  : toolButtonClass,
                {
                  [selectedToolClass]:
                    store.activeTool.type === cat.toolType && store.activeTool.value === item,
                },
              ]"
              :style="cat.toolType === 'background' ? { backgroundColor: item } : {}"
              @click="selectTool(cat.toolType as ToolType, item)"
              :title="item"
            >
              <component
                v-if="cat.toolType === 'icon'"
                :is="getIcon(item)"
                class="w-5 h-5 md:w-6 md:h-6"
              />
              <template v-else-if="cat.toolType === 'text'">{{ item }}</template>
            </button>
          </template>
        </template>

        <!-- Predefined and instructional templates lists -->
        <template v-if="activeTab === 'tasks'">
          <div class="flex flex-col gap-3.5 col-span-full pb-6">
            <button
              v-for="tpl in templates"
              :key="tpl.id"
              @click="
                store.loadTemplate(
                  tpl.size,
                  tpl.main,
                  tpl.secondary,
                  tpl.instructions || null,
                  tpl.id,
                )
              "
              class="flex flex-col text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-950/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-sm select-none"
            >
              <div class="flex justify-between items-center w-full">
                <span
                  class="font-bold text-slate-800 dark:text-slate-100 text-xs md:text-sm tracking-tight leading-tight"
                >
                  {{ getTemplateName(tpl) }}
                </span>
                <span
                  class="text-[8px] md:text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none shrink-0"
                  :class="
                    tpl.type === 'premade'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  "
                >
                  {{ tpl.type === "premade" ? store.t.pattern : store.t.task }}
                </span>
              </div>
              <p
                class="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-normal break-words"
              >
                {{ getTemplateDesc(tpl) }}
              </p>
              <span
                class="text-[10px] text-primary font-bold mt-3 flex items-center gap-1.5 hover:translate-x-1 transition-transform"
              >
                {{ store.t.loadBoard }} ({{ tpl.size }}x{{ tpl.size }}) &rarr;
              </span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </aside>
</template>
