<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { useMatStore } from "../stores/matStore";
import { getPlacedIcon } from "../utils/icons";
import { BookOpen, X } from "lucide-vue-next";

const store = useMatStore();
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const isHoveringGrid = ref(false);
const customCursorRef = ref<HTMLElement | null>(null);

const onMouseMove = (e: MouseEvent) => {
  if (customCursorRef.value) {
    const x = e.clientX + 12;
    const y = e.clientY + 12;
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
</script>

<template>
  <div
    class="w-full h-full overflow-auto bg-slate-50 dark:bg-[#0b0f19] relative transition-colors duration-300"
  >
    <div
      class="min-w-full w-max min-h-full h-max flex flex-col justify-center items-center p-4 md:p-8 gap-4"
    >
      <!-- Active Instructions Alert Box -->
      <div
        v-if="store.activeInstructions"
        class="w-full max-w-[calc(100vw-2rem)] sm:max-w-xl md:max-w-2xl select-none animate-fade-in"
      >
        <div
          class="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-900/60 dark:to-indigo-950/40 border-l-4 border-primary p-4 rounded-r-xl shadow-sm border border-l-0 border-slate-200/50 dark:border-slate-800/80"
        >
          <div class="flex items-start gap-3">
            <BookOpen class="text-primary w-5 h-5 shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                {{ store.t.taskToPerform }}
              </h3>
              <p
                class="text-slate-600 dark:text-slate-300 text-xs md:text-sm mt-1 whitespace-pre-wrap leading-relaxed"
              >
                {{ store.activeInstructions }}
              </p>
            </div>
            <button
              @click="store.activeInstructions = null"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Main Board Wrapper -->
      <div
        class="flex flex-col bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-2xl shadow-xl dark:shadow-slate-950/40 border border-slate-100 dark:border-slate-800/80 transition-colors duration-300"
        id="mat-grid-container"
        @mouseenter="isHoveringGrid = true"
        @mouseleave="isHoveringGrid = false"
        @mousemove="onMouseMove"
      >
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
              class="absolute pointer-events-none z-10 flex justify-center items-center transition-all duration-300 ease-in-out"
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
                  'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-bounce':
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
                class="w-[65%] h-[65%] text-slate-800 dark:text-slate-100 z-10 drop-shadow-[0_2px_4px_rgba(255,255,255,0.85)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out"
                :style="{
                  transform:
                    'rotate(' + store.getDirectionAngle(store.simulationRobot.dir) + 'deg)',
                }"
              />
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
                class="flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 border-r border-b border-grid-line dark:border-grid-line-dark cursor-crosshair transition-all duration-100 hover:brightness-95 dark:hover:brightness-110 focus-cell focus:z-20"
                :class="{
                  'sym-line-horizontal': rIndex === Math.floor(store.gridSize / 2) - 1,
                  'sym-line-vertical': cIndex === Math.floor(store.gridSize / 2) - 1,
                }"
                :style="{ backgroundColor: cell.bg || 'transparent' }"
                @mousedown="paintCell(rIndex, cIndex)"
                @mouseenter="dragPaintCell($event, rIndex, cIndex)"
                @keydown="handleKeyDown($event, rIndex, cIndex, false)"
                @touchstart.passive="handleTouchStart($event, rIndex, cIndex, false)"
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
        <div class="h-4 md:h-8"></div>

        <!-- Secondary Grid -->
        <div class="flex flex-row">
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
                class="flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 border-r border-b border-grid-line dark:border-grid-line-dark cursor-crosshair transition-all duration-100 hover:brightness-95 dark:hover:brightness-110 focus-cell focus:z-20 relative text-center"
                :class="{
                  'ring-2 ring-primary ring-offset-1 z-10 shadow-lg shadow-primary/20 scale-105 border-primary dark:border-primary !border-solid rounded-md bg-indigo-50/50 dark:bg-indigo-950/20':
                    cell.id === store.simulationActiveInstructionId,
                }"
                :style="{ backgroundColor: cell.bg || 'transparent' }"
                @mousedown="paintCell(rIndex, cIndex, true)"
                @mouseenter="dragPaintCell($event, rIndex, cIndex, true)"
                @keydown="handleKeyDown($event, rIndex, cIndex, true)"
                @touchstart.passive="handleTouchStart($event, rIndex, cIndex, true)"
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
      class="fixed top-0 left-0 pointer-events-none z-50 flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 opacity-75 drop-shadow-xl transform-gpu transition-all duration-75"
    >
      <div
        v-if="store.activeTool.type === 'background'"
        class="w-full h-full rounded border-2 border-white shadow-md"
        :style="{ backgroundColor: store.activeTool.value || 'transparent' }"
      ></div>
      <component
        v-else-if="store.activeTool.type === 'icon' && store.activeTool.value"
        :is="getPlacedIcon(store.activeTool.value)"
        class="w-[65%] h-[65%] text-slate-800 dark:text-slate-200 drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]"
      />
      <span
        v-else-if="store.activeTool.type === 'text' && store.activeTool.value"
        class="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100 drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]"
        >{{ store.activeTool.value }}</span
      >
    </div>
  </div>
</template>
