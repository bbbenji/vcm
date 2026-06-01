<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useMatStore } from "../stores/matStore";
import type { ToolType } from "../stores/matStore";
import { getIcon } from "../utils/icons";
import { templates } from "../utils/templates";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderHeart,
  Plus,
  Sparkles,
  FolderOpen,
  Save,
} from "lucide-vue-next";
import SimulationControls from "./SimulationControls.vue";
import TemplateCard from "./TemplateCard.vue";

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
  { id: "my_mats" as const, icon: "FolderHeart", toolType: "task" as ToolType, items: [] as string[] },
];

const taskCategories = [
  { id: "pixel_art" as const, titleKey: "cat_pixel_art" as const, icon: "Palette" },
  { id: "algorithm" as const, titleKey: "cat_algorithm" as const, icon: "Move" },
  { id: "math_symmetry" as const, titleKey: "cat_math_symmetry" as const, icon: "Binary" },
];

const activeTab = computed({
  get: () => store.activeTab as (typeof categories)[number]["id"],
  set: (val) => { store.activeTab = val; }
});
const isCollapsed = computed({
  get: () => store.isCollapsed,
  set: (val) => { store.isCollapsed = val; }
});
const showSaveForm = computed({
  get: () => store.showSaveForm,
  set: (val) => { store.showSaveForm = val; }
});

// Custom templates (My Saved Mats) logic
const customName = ref("");
const customDesc = ref("");
const customInstructions = ref("");
const saveSuccessMessage = ref(false);
const saveSuccessUpdateMessage = ref(false);

const activeCustomTemplate = computed(() => {
  if (!store.currentTemplateId || !store.currentTemplateId.startsWith("custom_")) return null;
  return store.customTemplates.find((t) => t.id === store.currentTemplateId);
});

// Watch loaded custom template to prepopulate name/desc/instructions when editing!
watch(activeCustomTemplate, (tpl) => {
  if (tpl) {
    customName.value = tpl.name;
    customDesc.value = tpl.desc || "";
    customInstructions.value = tpl.instructions || "";
  } else {
    customName.value = "";
    customDesc.value = "";
    customInstructions.value = "";
  }
}, { immediate: true });

const handleSaveCustomMat = () => {
  store.saveCurrentAsTemplate(
    customName.value,
    customDesc.value,
    customInstructions.value
  );
  showSaveForm.value = false;
  
  // Show gorgeous success feedback
  saveSuccessMessage.value = true;
  setTimeout(() => {
    saveSuccessMessage.value = false;
  }, 3000);
};

const handleUpdateCustomMat = () => {
  if (!activeCustomTemplate.value) return;
  store.updateCustomTemplate(
    activeCustomTemplate.value.id,
    customName.value,
    customDesc.value,
    customInstructions.value
  );
  showSaveForm.value = false;

  // Show gorgeous update success feedback
  saveSuccessUpdateMessage.value = true;
  setTimeout(() => {
    saveSuccessUpdateMessage.value = false;
  }, 3000);
};

const handleDeleteCustomMat = (tplId: string) => {
  if (confirm(store.t.deleteConfirm || "Are you sure you want to delete this template?")) {
    store.deleteCustomTemplate(tplId);
  }
};

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
const drawerContainerRef = ref<HTMLElement | null>(null);
const showLeftShadow = ref(false);
const showRightShadow = ref(false);

watch(() => store.activeTab, (newTab) => {
  setTimeout(() => {
    // 1. Scroll horizontal tab bar to show the active tab button
    const tabsContainer = tabsContainerRef.value;
    if (tabsContainer) {
      const activeBtn = tabsContainer.querySelector(`[data-tab-id="${newTab}"]`) as HTMLElement | null;
      if (activeBtn) {
        const containerRect = tabsContainer.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        
        if (btnRect.left < containerRect.left || btnRect.right > containerRect.right) {
          tabsContainer.scrollTo({
            left: activeBtn.offsetLeft - (tabsContainer.clientWidth / 2) + (activeBtn.clientWidth / 2),
            behavior: 'smooth'
          });
        }
      }
    }

    // 2. Scroll the drawer container to the top
    if (drawerContainerRef.value) {
      drawerContainerRef.value.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, 50);
});

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
const getTemplateName = (tpl: { id: string; name?: string; desc?: string }) => {
  if (tpl.id.startsWith("custom_")) {
    return tpl.name || "";
  }
  const key = `tpl_${tpl.id}_name` as keyof typeof store.t;
  return (store.t[key] as string) || tpl.name || "";
};

const getTemplateDesc = (tpl: { id: string; name?: string; desc?: string }) => {
  if (tpl.id.startsWith("custom_")) {
    return tpl.desc || "";
  }
  const key = `tpl_${tpl.id}_desc` as keyof typeof store.t;
  return (store.t[key] as string) || tpl.desc || "";
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
          :data-tab-id="cat.id"
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
      ref="drawerContainerRef"
      class="py-3 px-3 md:p-5 flex-1 overflow-y-auto bg-white dark:bg-slate-900 transition-colors duration-300"
    >
      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] md:grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-2.5"
      >
        <!-- Special eraser button (available in all item lists) -->
        <button
          v-if="activeTab !== 'tasks' && activeTab !== 'my_mats'"
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
                <TemplateCard
                  v-for="tpl in templates.filter((t) => t.category === cat.id)"
                  :key="tpl.id"
                  :tpl="tpl"
                  :is-custom="false"
                  :get-template-name="getTemplateName"
                  :get-template-desc="getTemplateDesc"
                  :load-label="store.t.loadBoard"
                  :pattern-label="store.t.pattern"
                  :task-label="store.t.task"
                  @load="
                    store.loadTemplate(
                      tpl.size,
                      tpl.main,
                      tpl.secondary,
                      null,
                      tpl.id,
                    )
                  "
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Custom templates lists (My Mats) -->
        <template v-if="activeTab === 'my_mats'">
          <div class="flex flex-col gap-4 col-span-full pb-6 relative w-full animate-fade-in">
            
            <!-- Success Toast Banner (New Mat) -->
            <transition name="slide-up">
              <div
                v-if="saveSuccessMessage"
                class="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-md shadow-emerald-500/10 mb-2 select-none"
              >
                <component :is="Sparkles" class="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>{{ store.t.saveSuccess }}</span>
              </div>
            </transition>

            <!-- Success Toast Banner (Update Mat) -->
            <transition name="slide-up">
              <div
                v-if="saveSuccessUpdateMessage"
                class="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-md shadow-emerald-500/10 mb-2 select-none"
              >
                <component :is="Sparkles" class="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>{{ store.t.saveSuccessUpdate }}</span>
              </div>
            </transition>

            <!-- Save Current Mat Expandable Card Form -->
            <div class="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
              <button
                @click="showSaveForm = !showSaveForm"
                class="flex items-center justify-between w-full font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100 hover:text-primary transition-colors cursor-pointer select-none"
              >
                <span class="flex items-center gap-2">
                  <component :is="Save" class="w-4.5 h-4.5 text-primary shrink-0" />
                  {{ store.t.saveCurrentMatTitle }}
                </span>
                <component
                  :is="showSaveForm ? ChevronUp : ChevronDown"
                  class="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-300"
                />
              </button>

              <transition name="expand">
                <form
                  v-if="showSaveForm"
                  @submit.prevent="handleSaveCustomMat"
                  class="flex flex-col gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60"
                >
                  <!-- Name Input -->
                  <div class="flex flex-col gap-1.5">
                    <input
                      v-model="customName"
                      type="text"
                      required
                      :placeholder="store.t.matTitlePlaceholder"
                      class="px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs md:text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary transition-all font-semibold"
                    />
                  </div>

                  <!-- Description Input -->
                  <div class="flex flex-col gap-1.5">
                    <input
                      v-model="customDesc"
                      type="text"
                      :placeholder="store.t.matDescPlaceholder"
                      class="px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs md:text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <!-- Instructions Input -->
                  <div class="flex flex-col gap-1.5">
                    <textarea
                      v-model="customInstructions"
                      rows="3"
                      :placeholder="store.t.matInstrPlaceholder"
                      class="px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs md:text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none leading-relaxed"
                    ></textarea>
                  </div>

                  <!-- Submit button actions (Save changes / Save as new) -->
                  <div v-if="activeCustomTemplate" class="flex flex-col gap-2 mt-1 select-none">
                    <!-- Overwrite / Save changes -->
                    <button
                      type="button"
                      @click="handleUpdateCustomMat"
                      class="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-98 cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      <component :is="Save" class="w-4.5 h-4.5" />
                      <span>{{ store.t.saveChanges }}</span>
                    </button>
                    
                    <!-- Save as New -->
                    <button
                      type="button"
                      @click="handleSaveCustomMat"
                      class="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-98 cursor-pointer shadow-md border border-slate-200 dark:border-slate-750"
                    >
                      <component :is="Plus" class="w-4 h-4" />
                      <span>{{ store.t.saveAsNew }}</span>
                    </button>
                  </div>

                  <!-- Standard Submit button -->
                  <button
                    v-else
                    type="submit"
                    class="flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all active:scale-98 cursor-pointer shadow-md shadow-primary/10 mt-1 select-none"
                  >
                    <component :is="Plus" class="w-4 h-4" />
                    <span>{{ store.t.saveBtn }}</span>
                  </button>
                </form>
              </transition>
            </div>

            <!-- Custom Templates List Header -->
            <div
              class="flex items-center gap-2 px-1 border-b border-slate-150 dark:border-slate-800 pb-1.5 mt-2 select-none"
            >
              <component
                :is="FolderOpen"
                :size="13"
                class="text-slate-400 dark:text-slate-500 shrink-0"
              />
              <span
                class="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
              >
                {{ store.t.my_mats }}
              </span>
              <span
                class="text-[8px] font-bold px-1.5 py-0.25 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ml-auto animate-pulse-glow"
              >
                {{ store.customTemplates.length }}
              </span>
            </div>

            <!-- List Cards or Empty State -->
            <div v-if="store.customTemplates.length === 0" class="flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-950/20">
              <component :is="FolderHeart" class="w-8 h-8 text-slate-350 dark:text-slate-700 animate-pulse mb-2.5" />
              <p class="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-[200px]">
                {{ store.t.emptyCustomMats }}
              </p>
            </div>

            <div v-else class="flex flex-col gap-3">
              <TemplateCard
                v-for="tpl in store.customTemplates"
                :key="tpl.id"
                :tpl="tpl"
                :is-custom="true"
                :get-template-name="getTemplateName"
                :get-template-desc="getTemplateDesc"
                :load-label="store.t.loadBoard"
                @load="
                  store.loadTemplate(
                    tpl.size,
                    tpl.main,
                    tpl.secondary,
                    tpl.instructions,
                    tpl.id,
                  )
                "
                @delete="handleDeleteCustomMat"
              />
            </div>

          </div>
        </template>
      </div>
    </div>
  </aside>
</template>
