<script setup lang="ts">
import { ref, computed } from "vue";
import { useMatStore } from "../stores/matStore";
import { getPlacedIcon } from "../utils/icons";
import { BookOpen, X } from "lucide-vue-next";

const store = useMatStore();

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const isHoveringGrid = ref(false);
const mousePos = ref({ x: 0, y: 0 });

const onMouseMove = (e: MouseEvent) => {
  mousePos.value = { x: e.clientX, y: e.clientY };
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
  <div class="w-full h-full overflow-auto bg-slate-50 relative">
    <div class="min-w-full w-max min-h-full h-max flex flex-col justify-center items-center p-4 md:p-8 gap-4">
      <!-- Active Instructions Alert Box -->
      <div v-if="store.activeInstructions" class="w-full max-w-[calc(100vw-2rem)] sm:max-w-xl md:max-w-2xl select-none animate-fade-in">
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm border border-l-0 border-slate-200/50">
          <div class="flex items-start gap-3">
            <BookOpen class="text-blue-600 w-5 h-5 shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="font-bold text-slate-800 text-sm md:text-base">Zadanie do wykonania:</h3>
              <p class="text-slate-600 text-xs md:text-sm mt-1 whitespace-pre-wrap leading-relaxed">{{ store.activeInstructions }}</p>
            </div>
            <button @click="store.activeInstructions = null" class="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>


      <div 
        class="flex flex-col bg-white p-2.5 sm:p-4 rounded-2xl shadow-xl" 
        id="mat-grid-container"
        @mouseenter="isHoveringGrid = true"
        @mouseleave="isHoveringGrid = false"
        @mousemove="onMouseMove"
      >
      <div class="flex flex-row font-bold text-slate-500 select-none">
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
        <div class="flex flex-col font-bold text-slate-500 select-none">
          <div
            class="flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-xs sm:text-sm md:text-base lg:text-lg font-bold"
            v-for="row in store.gridSize"
            :key="'left-' + row"
          >
            {{ row }}
          </div>
        </div>

        <!-- The Mat -->
        <div
          class="grid bg-white border-t-2 border-l-2 border-grid-line touch-none select-none relative"
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
              stroke="#60a5fa" 
              stroke-width="1.6" 
              stroke-linecap="round"
              stroke-linejoin="round"
              class="opacity-30 blur-[1px] transition-all duration-300 ease-in-out"
            />
            <!-- Dashed trace line -->
            <path 
              :d="trailPathD" 
              fill="none" 
              stroke="#3b82f6" 
              stroke-width="0.8" 
              stroke-dasharray="1.5,1.5" 
              stroke-linecap="round"
              stroke-linejoin="round"
              class="opacity-80 transition-all duration-300 ease-in-out"
            />
            <!-- Visited cell markers -->
            <circle
              v-for="(pos, idx) in store.simulationPathHistory"
              :key="'dot-' + idx"
              :cx="((pos.c + 0.5) / store.gridSize) * 100"
              :cy="((pos.r + 0.5) / store.gridSize) * 100"
              r="0.6"
              fill="#2563eb"
              class="opacity-75"
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
                'bg-blue-100 border-blue-500 animate-pulse': store.simulationStatus === 'running',
                'bg-emerald-100 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]': store.simulationStatus === 'success',
                'bg-rose-100 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)] animate-bounce': ['collision', 'out_of_bounds'].includes(store.simulationStatus),
                'bg-amber-100 border-amber-500': store.simulationStatus === 'paused',
                'bg-slate-100 border-slate-400': store.simulationStatus === 'ready',
              }"
            ></div>
            <!-- Character Avatar (Upright, no rotation to prevent off-center layout) -->
            <component
              :is="getPlacedIcon(store.simulationRobot.icon)"
              class="w-[65%] h-[65%] text-slate-800 z-10 drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]"
            />
          </div>

          <template v-for="(row, rIndex) in store.gridData" :key="'row-' + rIndex">
            <div
              v-for="(cell, cIndex) in row"
              :key="cell.id"
              :data-row="rIndex"
              :data-col="cIndex"
              :data-secondary="false"
              class="flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 border-r border-b border-grid-line cursor-crosshair transition-[filter] duration-100 hover:brightness-95"
              :class="{
                'border-b-2 border-b-grid-sym-line': rIndex === Math.floor(store.gridSize / 2) - 1,
                'border-r-2 border-r-grid-sym-line': cIndex === Math.floor(store.gridSize / 2) - 1,
              }"
              :style="{ backgroundColor: cell.bg || 'transparent' }"
              @mousedown="paintCell(rIndex, cIndex)"
              @mouseenter="dragPaintCell($event, rIndex, cIndex)"
              @touchstart.passive="handleTouchStart($event, rIndex, cIndex, false)"
            >
              <component
                v-if="cell.icon"
                :is="getPlacedIcon(cell.icon)"
                class="w-[65%] h-[65%] text-slate-800 pointer-events-none"
              />
              <span
                v-else-if="cell.text"
                class="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-slate-800 pointer-events-none"
                >{{ cell.text }}</span
              >
            </div>
          </template>
        </div>

        <!-- Right Axis (Numbers) -->
        <div class="flex flex-col font-bold text-slate-500 select-none">
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
      <div class="flex flex-row font-bold text-slate-500 select-none">
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

        <!-- Secondary Grid Board -->
        <div
          class="grid bg-white border-t-2 border-l-2 border-grid-line touch-none select-none"
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
              class="flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 border-r border-b border-grid-line cursor-crosshair transition-all duration-100 hover:brightness-95 relative"
              :class="{
                'ring-2 ring-primary ring-offset-1 z-10 shadow-lg shadow-primary/25 scale-105 border-primary !border-solid rounded-md bg-blue-50/50': cell.id === store.simulationActiveInstructionId
              }"
              :style="{ backgroundColor: cell.bg || 'transparent' }"
              @mousedown="paintCell(rIndex, cIndex, true)"
              @mouseenter="dragPaintCell($event, rIndex, cIndex, true)"
              @touchstart.passive="handleTouchStart($event, rIndex, cIndex, true)"
            >
              <component
                v-if="cell.icon"
                :is="getPlacedIcon(cell.icon)"
                class="w-[65%] h-[65%] text-slate-800 pointer-events-none"
              />
              <span
                v-else-if="cell.text"
                class="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-slate-800 pointer-events-none"
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

    <!-- Custom Cursor Overlay -->
    <div
      v-if="isHoveringGrid && !isTouchDevice"
      class="fixed pointer-events-none z-50 flex justify-center items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 opacity-70 drop-shadow-xl"
      :style="{ 
        left: (mousePos.x + 12) + 'px', 
        top: (mousePos.y + 12) + 'px',
      }"
    >
      <div v-if="store.activeTool.type === 'background'" class="w-full h-full rounded border-2 border-white shadow-md" :style="{ backgroundColor: store.activeTool.value || 'transparent' }"></div>
      <component v-else-if="store.activeTool.type === 'icon' && store.activeTool.value" :is="getPlacedIcon(store.activeTool.value)" class="w-[65%] h-[65%] text-slate-800 drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]" />
      <span v-else-if="store.activeTool.type === 'text' && store.activeTool.value" class="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-slate-800 drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">{{ store.activeTool.value }}</span>
    </div>
  </div>
</template>
