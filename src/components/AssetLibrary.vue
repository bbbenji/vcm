<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useMatStore } from "../stores/matStore";
import type { ToolType } from "../stores/matStore";
import { getIcon } from "../utils/icons";
import { templates } from "../utils/templates";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-vue-next";
import SimulationControls from "./SimulationControls.vue";

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
  "Bot",
  "EvCharger",
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
  "Num6Icon",
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

const taskCategories = [
  { id: "pixel_art" as const, titleKey: "cat_pixel_art" as const, icon: "Palette" },
  { id: "algorithm" as const, titleKey: "cat_algorithm" as const, icon: "Move" },
  { id: "math_symmetry" as const, titleKey: "cat_math_symmetry" as const, icon: "Binary" },
];

const activeTab = ref<(typeof categories)[number]["id"]>("bg");
const isCollapsed = ref(false);

const selectTool = (type: ToolType, value: string | null) => {
  store.activeTool = { type, value };
};

const handleDragStart = (e: DragEvent, type: ToolType, value: string | null) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData("application/json", JSON.stringify({ type, value }));
    store.activeTool = { type, value };
  }
};

const tabsContainerRef = ref<HTMLElement | null>(null);
const showLeftShadow = ref(false);
const showRightShadow = ref(false);

const updateScrollShadows = () => {
  const el = tabsContainerRef.value;
  if (!el) return;
  showLeftShadow.value = el.scrollLeft > 2;
  showRightShadow.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
};

const scrollTabs = (direction: "left" | "right") => {
  const el = tabsContainerRef.value;
  if (!el) return;
  const scrollAmount = direction === "left" ? -125 : 125;
  el.scrollBy({
    left: scrollAmount,
    behavior: "smooth",
  });
};

onMounted(() => {
  updateScrollShadows();
  window.addEventListener("resize", updateScrollShadows);
  setTimeout(updateScrollShadows, 100);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScrollShadows);
});

const selectTab = (tabId: (typeof categories)[number]["id"]) => {
  activeTab.value = tabId;
  isCollapsed.value = false;
  // Recalculate shadows when switching tabs since active styling might shift sizing
  setTimeout(updateScrollShadows, 50);
};

// Helpers for template localization
const getTemplateName = (tpl: (typeof templates)[number]) => {
  const key = `tpl_${tpl.id}_name` as keyof typeof store.t;
  return store.t[key] as string;
};

const getTemplateDesc = (tpl: (typeof templates)[number]) => {
  const key = `tpl_${tpl.id}_desc` as keyof typeof store.t;
  return store.t[key] as string;
};

type LegendEntry = {
  icon: string;
  labelKey: keyof typeof store.t;
  sim: boolean;
  isNum?: boolean;
};

const movementLegend: LegendEntry[] = [
  { icon: 'Bot',            labelKey: 'moveLegendBot',           sim: true },
  { icon: 'EvCharger',      labelKey: 'moveLegendEvCharger',     sim: true },
  { icon: 'ArrowUp',        labelKey: 'moveLegendArrowUp',       sim: true },
  { icon: 'ArrowDown',      labelKey: 'moveLegendArrowDown',     sim: true },
  { icon: 'ArrowRight',     labelKey: 'moveLegendArrowRight',    sim: true },
  { icon: 'ArrowLeft',      labelKey: 'moveLegendArrowLeft',     sim: true },
  { icon: 'CornerUpRight',  labelKey: 'moveLegendCornerUpRight', sim: true },
  { icon: 'CornerUpLeft',   labelKey: 'moveLegendCornerUpLeft',  sim: true },
  { icon: 'Num2Icon',       labelKey: 'moveLegendNum',           sim: true,  isNum: true },
  { icon: 'PlayFilled',     labelKey: 'moveLegendPlayFilled',    sim: false },
  { icon: 'StopFilled',     labelKey: 'moveLegendStopFilled',    sim: false },
  { icon: 'F1Icon',         labelKey: 'moveLegendF1',            sim: false },
  { icon: 'F2Icon',         labelKey: 'moveLegendF2',            sim: false },
  { icon: 'LoopPlayIcon',   labelKey: 'moveLegendLoopPlay',      sim: false },
  { icon: 'LoopStopIcon',   labelKey: 'moveLegendLoopStop',      sim: false },
];
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

    <!-- Simulation Control Panel -->
    <SimulationControls />

    <!-- Category Tabs Selector Wrapper with Premium Scroll Shadows & Chevrons -->
    <div class="relative w-full overflow-hidden shrink-0">
      <!-- Left scroll shadow fade -->
      <div
        class="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-slate-100/90 dark:from-slate-950 via-slate-50/60 dark:via-slate-950/50 to-transparent pointer-events-none z-10 transition-opacity duration-300"
        :class="showLeftShadow ? 'opacity-100' : 'opacity-0'"
      ></div>

      <!-- Right scroll shadow fade -->
      <div
        class="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-slate-100/90 dark:from-slate-950 via-slate-50/60 dark:via-slate-950/50 to-transparent pointer-events-none z-10 transition-opacity duration-300"
        :class="showRightShadow ? 'opacity-100' : 'opacity-0'"
      ></div>

      <!-- Left scroll indicator chevron button -->
      <button
        @click="scrollTabs('left')"
        class="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-md border border-slate-150 dark:border-slate-700/80 cursor-pointer z-20 transition-all duration-300 hover:scale-105 active:scale-90 hover:bg-slate-50 dark:hover:bg-slate-700"
        :class="
          showLeftShadow
            ? 'opacity-100 translate-x-0 scale-100'
            : 'opacity-0 -translate-x-2 scale-75 pointer-events-none'
        "
        title="Scroll Left"
      >
        <component :is="ChevronLeft" :size="12" class="stroke-[3]" />
      </button>

      <!-- Right scroll indicator chevron button -->
      <button
        @click="scrollTabs('right')"
        class="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-md border border-slate-150 dark:border-slate-700/80 cursor-pointer z-20 transition-all duration-300 hover:scale-105 active:scale-90 hover:bg-slate-50 dark:hover:bg-slate-700"
        :class="
          showRightShadow
            ? 'opacity-100 translate-x-0 scale-100 animate-pulse'
            : 'opacity-0 translate-x-2 scale-75 pointer-events-none'
        "
        title="Scroll Right"
      >
        <component :is="ChevronRight" :size="12" class="stroke-[3]" />
      </button>

      <!-- Scrollable Category Tabs selector -->
      <div
        ref="tabsContainerRef"
        @scroll="updateScrollShadows"
        class="flex flex-row overflow-x-auto whitespace-nowrap p-2 gap-1 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 scrollbar-none"
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
          draggable="true"
          @dragstart="handleDragStart($event, 'eraser', null)"
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
              draggable="true"
              @dragstart="handleDragStart($event, cat.toolType as ToolType, item)"
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
              <span
                v-if="
                  cat.toolType === 'icon' &&
                  ['Num2Icon', 'Num3Icon', 'Num4Icon', 'Num5Icon', 'Num6Icon'].includes(item)
                "
                class="text-xl font-bold select-none text-slate-800 dark:text-slate-100 flex justify-center items-center w-full h-full"
              >
                {{ item.replace("Num", "").replace("Icon", "") }}
              </span>
              <component
                v-else-if="cat.toolType === 'icon'"
                :is="getIcon(item)"
                class="w-5 h-5 md:w-6 md:h-6"
                :class="
                  item === 'Bot'
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : item === 'EvCharger'
                      ? 'text-amber-500 dark:text-amber-400'
                      : ''
                "
              />
              <template v-else-if="cat.toolType === 'text'">{{ item }}</template>
            </button>
          </template>
        </template>

        <!-- Movement Symbol Legend -->
        <template v-if="activeTab === 'move'">
          <div class="col-span-full mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <component :is="getIcon('HelpCircle')" :size="11" />
              {{ store.t.moveLegendTitle }}
            </p>
            <div class="flex flex-col gap-1.5">
              <div
                v-for="entry in movementLegend"
                :key="entry.icon"
                class="flex items-center gap-2.5"
              >
                <!-- Icon preview -->
                <div class="w-7 h-7 shrink-0 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  <span
                    v-if="entry.isNum"
                    class="text-[10px] font-bold select-none text-slate-800 dark:text-slate-100"
                  >2–6×</span>
                  <component
                    v-else
                    :is="getIcon(entry.icon)"
                    class="w-4 h-4"
                    :class="
                      entry.icon === 'Bot'
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : entry.icon === 'EvCharger'
                          ? 'text-amber-500 dark:text-amber-400'
                          : 'text-slate-600 dark:text-slate-300'
                    "
                  />
                </div>
                <!-- Description -->
                <span class="text-[10px] text-slate-600 dark:text-slate-400 leading-tight flex-1">
                  {{ store.t[entry.labelKey] }}
                </span>
                <!-- Sim / Decorative badge -->
                <span
                  class="text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide"
                  :class="entry.sim
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  "
                >
                  {{ entry.sim ? store.t.moveLegendSimTag : store.t.moveLegendExtTag }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- Predefined and instructional templates lists grouped by Category -->
        <template v-if="activeTab === 'tasks'">
          <div class="flex flex-col gap-5 col-span-full pb-6">
            <div v-for="cat in taskCategories" :key="cat.id" class="flex flex-col gap-2.5">
              <!-- Category Header -->
              <div
                class="flex items-center gap-2 px-1 border-b border-slate-100 dark:border-slate-800/60 pb-1.5 mt-3 select-none"
              >
                <component
                  :is="getIcon(cat.icon)"
                  :size="13"
                  class="text-slate-400 dark:text-slate-500 shrink-0"
                />
                <span
                  class="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                >
                  {{ store.t[cat.titleKey as keyof typeof store.t] }}
                </span>
                <span
                  class="text-[8px] font-bold px-1.5 py-0.25 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ml-auto"
                >
                  {{ templates.filter((t) => t.category === cat.id).length }}
                </span>
              </div>

              <!-- List of Templates in Category -->
              <div class="flex flex-col gap-3">
                <button
                  v-for="tpl in templates.filter((t) => t.category === cat.id)"
                  :key="tpl.id"
                  @click="
                    store.loadTemplate(
                      tpl.size,
                      tpl.main,
                      tpl.secondary,
                      null,
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
                    class="text-[10px] text-primary font-bold mt-3 flex items-center gap-1.5 hover:translate-x-1 transition-transform animate-pulse"
                  >
                    {{ store.t.loadBoard }} ({{ tpl.size }}x{{ tpl.size }}) &rarr;
                  </span>
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </aside>
</template>
