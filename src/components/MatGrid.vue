<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { useMatStore } from "../stores/matStore";
import { getPlacedIcon } from "../utils/icons";
import InstructionBanner from "./InstructionBanner.vue";
import confetti from "canvas-confetti";
import { trackEvent } from "../plugins/analytics";

const store = useMatStore();
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

import BaseDialog from "./BaseDialog.vue";

// Watch simulation success or crash to trigger particles & popup modals!
const isWinDialogOpen = ref(false);
const isLoseDialogOpen = ref(false);

watch(
  () => store.simulationStatus,
  (status) => {
    if (status === "success") {
      // Primary center blast
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Staggered side cannons for a spectacular victory celebration!
      const end = Date.now() + 2 * 1000; // 2 seconds duration
      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Show result popup modal with a premium delay!
      setTimeout(() => {
        if (store.simulationStatus === "success") {
          isWinDialogOpen.value = true;
        }
      }, 550);
    } else if (["collision", "out_of_bounds"].includes(status)) {
      // Show result popup modal with a premium delay!
      setTimeout(() => {
        if (["collision", "out_of_bounds"].includes(store.simulationStatus)) {
          isLoseDialogOpen.value = true;
        }
      }, 650);
    } else {
      isWinDialogOpen.value = false;
      isLoseDialogOpen.value = false;
    }
  },
);

const getSparkStyle = (i: number) => {
  if (!store.simulationRobot) return {};
  const startX = ((store.simulationRobot.c + 0.5) / store.gridSize) * 100;
  const startY = ((store.simulationRobot.r + 0.5) / store.gridSize) * 100;
  const angle = (i * 360) / 16 + ((i * 7) % 10) - 5;
  const rad = (angle * Math.PI) / 180;
  const distance = 40 + ((i * 13) % 45);
  const destX = Math.cos(rad) * distance;
  const destY = Math.sin(rad) * distance;
  const duration = 0.4 + ((i * 0.05) % 0.25);
  const delay = (i * 0.02) % 0.08;
  return {
    left: `${startX}%`,
    top: `${startY}%`,
    width: `${3 + (i % 4)}px`,
    height: `${3 + (i % 4)}px`,
    backgroundColor: i % 2 === 0 ? "#f43f5e" : "#f97316",
    borderRadius: "50%",
    animation: `sparkFly ${duration}s cubic-bezier(0.1, 0.8, 0.3, 1) ${delay}s both`,
    "--tx": `${destX}px`,
    "--ty": `${destY}px`,
    position: "absolute" as const,
  };
};

const isHoveringGrid = ref(false);
const customCursorRef = ref<HTMLElement | null>(null);

const onMouseMove = (e: MouseEvent) => {
  if (customCursorRef.value) {
    const x = e.clientX + 6;
    const y = e.clientY + 6;
    customCursorRef.value.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }
};

const trailPathD = computed(() => {
  if (store.simulationPathHistory.length < 2) return "";
  return store.simulationPathHistory
    .map((pos, idx) => {
      const x = ((pos.c + 0.5) / store.gridSize) * 100;
      const y = ((pos.r + 0.5) / store.gridSize) * 100;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
});

const paintCell = (row: number, col: number, isSecondary = false) => {
  store.saveHistory();
  store.updateCell(row, col, isSecondary);
  trackEvent(store.activeTool.type === "eraser" ? "remove_asset" : "place_asset", {
    tool_type: store.activeTool.type,
    tool_value: store.activeTool.value,
    is_secondary: isSecondary,
  });
};

const dragPaintCell = (event: MouseEvent, row: number, col: number, isSecondary = false) => {
  if (event.buttons !== 1) return;
  store.updateCell(row, col, isSecondary);
};

// Keyboard Draw Navigation Handler
const handleKeyDown = (e: KeyboardEvent, row: number, col: number, isSecondary = false) => {
  let nextR = row;
  let nextC = col;
  const maxRows = isSecondary ? 3 : store.gridSize;
  const maxCols = store.gridSize;

  switch (e.key) {
    case "ArrowUp":
      nextR = Math.max(0, row - 1);
      e.preventDefault();
      break;
    case "ArrowDown":
      nextR = Math.min(maxRows - 1, row + 1);
      e.preventDefault();
      break;
    case "ArrowLeft":
      nextC = Math.max(0, col - 1);
      e.preventDefault();
      break;
    case "ArrowRight":
      nextC = Math.min(maxCols - 1, col + 1);
      e.preventDefault();
      break;
    case " ":
    case "Enter":
      paintCell(row, col, isSecondary);
      e.preventDefault();
      return;
    case "Escape":
    case "Backspace":
    case "Delete":
      store.saveHistory();
      // Emulate eraser tool
      const cell = isSecondary ? store.secondaryGridData[row]?.[col] : store.gridData[row]?.[col];
      if (cell) {
        cell.bg = null;
        cell.icon = null;
        cell.text = null;
      }
      e.preventDefault();
      return;
    default:
      return;
  }

  // Focus next cell
  nextTick(() => {
    const selector = `[data-row="${nextR}"][data-col="${nextC}"][data-secondary="${isSecondary}"]`;
    const nextEl = document.querySelector(selector) as HTMLElement | null;
    nextEl?.focus();
  });
};

// Touch drawing support
const isTouchDevice = ref(false);
if (typeof window !== "undefined") {
  isTouchDevice.value = "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

const lastTouchedCell = ref<{ row: number; col: number; isSecondary: boolean } | null>(null);

const handleTouchStart = (e: TouchEvent, row: number, col: number, isSecondary = false) => {
  store.saveHistory();
  lastTouchedCell.value = { row, col, isSecondary };
  store.updateCell(row, col, isSecondary);
};

const handleTouchMove = (e: TouchEvent) => {
  if (!lastTouchedCell.value) return;
  const touch = e.touches[0];
  if (!touch) return;
  const element = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!element) return;

  const cell = element.closest("[data-row][data-col]") as HTMLElement | null;
  if (cell) {
    const row = parseInt(cell.dataset.row || "0", 10);
    const col = parseInt(cell.dataset.col || "0", 10);
    const isSecondary = cell.dataset.secondary === "true";

    if (
      lastTouchedCell.value.row !== row ||
      lastTouchedCell.value.col !== col ||
      lastTouchedCell.value.isSecondary !== isSecondary
    ) {
      lastTouchedCell.value = { row, col, isSecondary };
      store.updateCell(row, col, isSecondary);
    }
  }
};

const handleTouchEnd = () => {
  lastTouchedCell.value = null;
};

// HTML5 Drag and Drop handlers
import type { ToolType } from "../stores/matStore";
const dragOverCell = ref<{ row: number; col: number; isSecondary: boolean } | null>(null);

const handleDragEnter = (row: number, col: number, isSecondary: boolean) => {
  dragOverCell.value = { row, col, isSecondary };
};

const handleDragLeave = (row: number, col: number, isSecondary: boolean) => {
  if (
    dragOverCell.value &&
    dragOverCell.value.row === row &&
    dragOverCell.value.col === col &&
    dragOverCell.value.isSecondary === isSecondary
  ) {
    dragOverCell.value = null;
  }
};

const handleDrop = (e: DragEvent, row: number, col: number, isSecondary = false) => {
  e.preventDefault();
  dragOverCell.value = null;
  if (e.dataTransfer) {
    const dataStr = e.dataTransfer.getData("application/json");
    if (dataStr) {
      try {
        const { type, value } = JSON.parse(dataStr) as { type: ToolType; value: string | null };
        store.activeTool = { type, value };

        store.saveHistory();
        store.updateCell(row, col, isSecondary);
      } catch (err) {
        console.error("Failed to parse drop data", err);
      }
    }
  }
};
</script>

<template>
  <div
    class="w-full h-full overflow-auto bg-slate-50 dark:bg-[#0b0f19] relative transition-colors duration-300"
  >
    <div
      class="min-w-full w-max min-h-full h-max flex flex-col justify-center items-center p-4 md:p-8 gap-4"
    >
      <!-- Active Instructions Alert Box -->
      <InstructionBanner />

      <!-- Main Board Wrapper -->
      <div
        class="flex flex-col bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-2xl shadow-xl dark:shadow-slate-950/40 border border-slate-100 dark:border-slate-800/80 transition-colors duration-300"
        id="mat-grid-container"
        @mouseenter="isHoveringGrid = true"
        @mouseleave="isHoveringGrid = false"
        @mousemove="onMouseMove"
      >
        <!-- Export Logo (only visible during export) -->
        <div class="exporting-only justify-center items-center w-full">
          <img src="/logo.svg" alt="Logo" class="object-contain" />
        </div>

        <!-- Top Axis Headers (Letters) -->
        <div class="flex flex-row font-bold text-slate-500 dark:text-slate-400 select-none">
          <div class="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"></div>
          <div
            class="flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-xs sm:text-sm md:text-base lg:text-lg font-bold"
            v-for="col in store.gridSize"
            :key="'top-' + col"
          >
            {{ alphabet[col - 1] }}
          </div>
          <div class="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"></div>
        </div>

        <div class="flex flex-row">
          <!-- Left Axis (Numbers) -->
          <div class="flex flex-col font-bold text-slate-500 dark:text-slate-400 select-none">
            <div
              class="flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-xs sm:text-sm md:text-base lg:text-lg font-bold"
              v-for="row in store.gridSize"
              :key="'left-' + row"
            >
              {{ row }}
            </div>
          </div>

          <!-- The Mat Grid Board -->
          <div
            class="grid bg-white dark:bg-slate-950 border-t-2 border-l-2 border-grid-line dark:border-grid-line-dark touch-none select-none relative rounded-sm"
            :style="{
              gridTemplateColumns: `repeat(${store.gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${store.gridSize}, minmax(0, 1fr))`,
            }"
            @touchmove.prevent="handleTouchMove"
            @touchend="handleTouchEnd"
            @touchcancel="handleTouchEnd"
          >
            <!-- SVG Trail Path Overlay -->
            <svg
              v-if="store.isSimulating && trailPathD"
              class="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <!-- Glowing background neon aura -->
              <path
                :d="trailPathD"
                fill="none"
                stroke="#818cf8"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="opacity-45 blur-[1px] transition-all duration-300 ease-in-out animate-pulse-glow"
              />
              <!-- Dashed trace line -->
              <path
                :d="trailPathD"
                fill="none"
                stroke="#6366f1"
                stroke-width="0.8"
                stroke-dasharray="1.5,1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="opacity-90 transition-all duration-300 ease-in-out"
              />
              <!-- Visited cell markers -->
              <circle
                v-for="(pos, idx) in store.simulationPathHistory"
                :key="'dot-' + idx"
                :cx="((pos.c + 0.5) / store.gridSize) * 100"
                :cy="((pos.r + 0.5) / store.gridSize) * 100"
                r="0.6"
                fill="#4f46e5"
                class="opacity-80"
              />
            </svg>

            <!-- Animated Active Robot Layer during Simulation -->
            <div
              v-if="store.isSimulating && store.simulationRobot"
              class="absolute pointer-events-none z-30 flex justify-center items-center transition-all duration-300 ease-in-out"
              :class="{
                'animate-bounce-shake': ['collision', 'out_of_bounds'].includes(
                  store.simulationStatus,
                ),
              }"
              :style="{
                left: (store.simulationRobot.c / store.gridSize) * 100 + '%',
                top: (store.simulationRobot.r / store.gridSize) * 100 + '%',
                width: (1 / store.gridSize) * 100 + '%',
                height: (1 / store.gridSize) * 100 + '%',
              }"
            >
              <!-- Glowing background aura -->
              <div
                class="absolute inset-0.5 rounded-lg border-2 opacity-85 transition-colors duration-300"
                :class="{
                  'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 animate-pulse':
                    store.simulationStatus === 'running',
                  'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]':
                    store.simulationStatus === 'success',
                  'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]':
                    ['collision', 'out_of_bounds'].includes(store.simulationStatus),
                  'bg-amber-50 dark:bg-amber-950/40 border-amber-500':
                    store.simulationStatus === 'paused',
                  'bg-slate-50 dark:bg-slate-800/40 border-slate-400':
                    store.simulationStatus === 'ready',
                }"
              ></div>
              <!-- Character Avatar with SMOOTH elastic headings rotations -->
              <component
                :is="getPlacedIcon(store.simulationRobot.icon)"
                class="w-[65%] h-[65%] z-10 drop-shadow-[0_2px_4px_rgba(255,255,255,0.85)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out"
                :class="
                  store.simulationRobot.icon === 'Bot'
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-slate-800 dark:text-slate-100'
                "
                :style="{
                  transform:
                    'rotate(' + store.getDirectionAngle(store.simulationRobot.dir) + 'deg)',
                }"
              />
            </div>

            <!-- Spark Explosion and Shockwave Overlay on Lose Crash -->
            <div
              v-if="
                ['collision', 'out_of_bounds'].includes(store.simulationStatus) &&
                store.simulationRobot
              "
              class="absolute pointer-events-none inset-0 z-40"
            >
              <!-- Center expanding shockwave circle -->
              <div
                class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-rose-500/70 animate-shockwave"
                :style="{
                  left: ((store.simulationRobot.c + 0.5) / store.gridSize) * 100 + '%',
                  top: ((store.simulationRobot.r + 0.5) / store.gridSize) * 100 + '%',
                }"
              ></div>
              <!-- Radial expanding spark dust particles -->
              <div
                v-for="i in 16"
                :key="'spark-' + i"
                class="absolute spark-particle"
                :style="getSparkStyle(i)"
              ></div>
            </div>

            <!-- Mat cells generator -->
            <template v-for="(row, rIndex) in store.gridData" :key="'row-' + rIndex">
              <div
                v-for="(cell, cIndex) in row"
                :key="cell.id"
                :data-row="rIndex"
                :data-col="cIndex"
                :data-secondary="false"
                tabindex="0"
                role="gridcell"
                :aria-label="`Cell ${cell.id}`"
                class="flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 border-r border-b border-grid-line dark:border-grid-line-dark cursor-crosshair transition-all duration-100 hover:brightness-95 dark:hover:brightness-110 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 focus-cell focus:z-20"
                :class="{
                  'sym-line-horizontal': rIndex === Math.floor(store.gridSize / 2) - 1,
                  'sym-line-vertical': cIndex === Math.floor(store.gridSize / 2) - 1,
                  'ring-2 ring-primary/60 border-primary/50 scale-105 z-10 shadow-md bg-indigo-50/20 dark:bg-indigo-950/10':
                    dragOverCell &&
                    dragOverCell.row === rIndex &&
                    dragOverCell.col === cIndex &&
                    dragOverCell.isSecondary === false,
                }"
                :style="cell.bg ? { backgroundColor: cell.bg } : {}"
                @mousedown="paintCell(rIndex, cIndex)"
                @mouseenter="dragPaintCell($event, rIndex, cIndex)"
                @keydown="handleKeyDown($event, rIndex, cIndex, false)"
                @touchstart.passive="handleTouchStart($event, rIndex, cIndex, false)"
                @dragenter.prevent="handleDragEnter(rIndex, cIndex, false)"
                @dragleave="handleDragLeave(rIndex, cIndex, false)"
                @dragover.prevent
                @drop="handleDrop($event, rIndex, cIndex, false)"
              >
                <component
                  v-if="cell.icon"
                  :is="getPlacedIcon(cell.icon)"
                  class="w-[65%] h-[65%] pointer-events-none"
                  :class="
                    cell.icon === 'Bot'
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : cell.icon === 'EvCharger'
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-slate-800 dark:text-slate-200'
                  "
                />
                <span
                  v-else-if="cell.text"
                  class="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100 pointer-events-none select-none"
                  >{{ cell.text }}</span
                >
              </div>
            </template>
          </div>

          <!-- Right Axis (Numbers) -->
          <div class="flex flex-col font-bold text-slate-500 dark:text-slate-400 select-none">
            <div
              class="flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-xs sm:text-sm md:text-base lg:text-lg font-bold"
              v-for="row in store.gridSize"
              :key="'right-' + row"
            >
              {{ row }}
            </div>
          </div>
        </div>

        <!-- Bottom Axis (Letters) -->
        <div class="flex flex-row font-bold text-slate-500 dark:text-slate-400 select-none">
          <div class="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"></div>
          <div
            class="flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-xs sm:text-sm md:text-base lg:text-lg font-bold"
            v-for="col in store.gridSize"
            :key="'bottom-' + col"
          >
            {{ alphabet[col - 1] }}
          </div>
          <div class="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"></div>
        </div>

        <!-- Divider -->
        <div v-if="store.showSecondaryGrid" class="h-4 md:h-8"></div>

        <!-- Secondary Grid -->
        <div v-if="store.showSecondaryGrid" class="flex flex-row">
          <!-- Left Spacing to align with main grid -->
          <div class="flex flex-col font-bold text-slate-500 select-none">
            <div
              class="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
              v-for="row in 3"
              :key="'sec-left-' + row"
            ></div>
          </div>

          <!-- Secondary Grid Board (Instruction Queue) -->
          <div
            class="grid bg-white dark:bg-slate-950 border-t-2 border-l-2 border-grid-line dark:border-grid-line-dark touch-none select-none rounded-sm"
            :style="{
              gridTemplateColumns: `repeat(${store.gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(3, minmax(0, 1fr))`,
            }"
            @touchmove.prevent="handleTouchMove"
            @touchend="handleTouchEnd"
            @touchcancel="handleTouchEnd"
          >
            <template v-for="(row, rIndex) in store.secondaryGridData" :key="'sec-row-' + rIndex">
              <div
                v-for="(cell, cIndex) in row"
                :key="cell.id"
                :data-row="rIndex"
                :data-col="cIndex"
                :data-secondary="true"
                tabindex="0"
                role="gridcell"
                :aria-label="`Instruction cell ${cell.id}`"
                class="flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 border-r border-b border-grid-line dark:border-grid-line-dark cursor-crosshair transition-all duration-100 hover:brightness-95 dark:hover:brightness-110 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 focus-cell focus:z-20 relative text-center"
                :class="{
                  'ring-2 ring-primary ring-offset-1 z-10 shadow-lg shadow-primary/20 scale-105 border-primary dark:border-primary !border-solid rounded-md bg-indigo-50/50 dark:bg-indigo-950/20':
                    cell.id === store.simulationActiveInstructionId,
                  'ring-2 ring-primary/60 border-primary/50 scale-105 z-10 shadow-md bg-indigo-50/20 dark:bg-indigo-950/10':
                    dragOverCell &&
                    dragOverCell.row === rIndex &&
                    dragOverCell.col === cIndex &&
                    dragOverCell.isSecondary === true,
                }"
                :style="cell.bg ? { backgroundColor: cell.bg } : {}"
                @mousedown="paintCell(rIndex, cIndex, true)"
                @mouseenter="dragPaintCell($event, rIndex, cIndex, true)"
                @keydown="handleKeyDown($event, rIndex, cIndex, true)"
                @touchstart.passive="handleTouchStart($event, rIndex, cIndex, true)"
                @dragenter.prevent="handleDragEnter(rIndex, cIndex, true)"
                @dragleave="handleDragLeave(rIndex, cIndex, true)"
                @dragover.prevent
                @drop="handleDrop($event, rIndex, cIndex, true)"
              >
                <component
                  v-if="cell.icon"
                  :is="getPlacedIcon(cell.icon)"
                  class="w-[65%] h-[65%] text-slate-800 dark:text-slate-200 pointer-events-none"
                />
                <span
                  v-else-if="cell.text"
                  class="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100 pointer-events-none select-none"
                  >{{ cell.text }}</span
                >
              </div>
            </template>
          </div>

          <!-- Right Spacing to align with main grid -->
          <div class="flex flex-col font-bold text-slate-500 select-none">
            <div
              class="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
              v-for="row in 3"
              :key="'sec-right-' + row"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lag-Free Custom Cursor Overlay using Hardware Accelerated translate3d -->
    <div
      v-if="isHoveringGrid && !isTouchDevice"
      ref="customCursorRef"
      class="fixed top-0 left-0 pointer-events-none z-50 flex justify-center items-center w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 opacity-75 drop-shadow-md transform-gpu will-change-transform"
    >
      <div
        v-if="store.activeTool.type === 'background'"
        class="w-full h-full rounded border-2 border-white shadow-md"
        :style="{ backgroundColor: store.activeTool.value || 'transparent' }"
      ></div>
      <component
        v-else-if="store.activeTool.type === 'icon' && store.activeTool.value"
        :is="getPlacedIcon(store.activeTool.value)"
        class="w-[65%] h-[65%] drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]"
        :class="
          store.activeTool.value === 'Bot'
            ? 'text-emerald-500 dark:text-emerald-400'
            : store.activeTool.value === 'EvCharger'
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-slate-800 dark:text-slate-200'
        "
      />
      <span
        v-else-if="store.activeTool.type === 'text' && store.activeTool.value"
        class="text-xs sm:text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)] select-none"
        >{{ store.activeTool.value }}</span
      >
    </div>

    <!-- Win Dialog -->
    <BaseDialog
      :is-open="isWinDialogOpen"
      :title="store.t.simSuccess"
      :description="
        store.lang === 'pl'
          ? 'Robot pomyślnie dotarł do ładowarki i naładował baterie!'
          : 'The robot successfully reached the charger and recharged its batteries!'
      "
      confirm-text="OK"
      confirm-variant="emerald"
      icon-type="win"
      @confirm="store.resetSimulation"
      @close="isWinDialogOpen = false"
    />

    <!-- Lose Dialog -->
    <BaseDialog
      :is-open="isLoseDialogOpen"
      :title="
        store.simulationStatus === 'collision' ? store.t.simCollision : store.t.simOutOfBounds
      "
      :description="
        store.simulationStatus === 'collision'
          ? store.lang === 'pl'
            ? 'Robot zderzył się z przeszkodą! Spróbuj poprawić trasę.'
            : 'The robot collided with an obstacle! Try to adjust the path.'
          : store.lang === 'pl'
            ? 'Robot wypadł poza krawędź planszy! Spróbuj poprawić trasę.'
            : 'The robot went off the edge of the board! Try to adjust the path.'
      "
      :confirm-text="store.lang === 'pl' ? 'Spróbuj ponownie' : 'Retry'"
      confirm-variant="rose"
      icon-type="lose"
      @confirm="store.resetSimulation"
      @close="isLoseDialogOpen = false"
    />
  </div>
</template>
