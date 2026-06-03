<script setup lang="ts">
import { useMatStore } from "../stores/matStore";
import { Play, Pause, RotateCcw, Lightbulb, Turtle, Gauge, Zap } from "lucide-vue-next";
import { getIcon } from "../utils/icons";
import { trackEvent } from "../plugins/analytics";

const store = useMatStore();
</script>

<template>
  <!-- Simulation Control Panel in Sidebar -->
  <div
    v-if="store.showSecondaryGrid && store.instructionsExist"
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
        <span
          class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-none flex items-center gap-1 select-none"
        >
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
          <template v-else-if="store.simulationStatus === 'success'">
            <span class="flex items-center gap-1">
              {{ store.t.simSuccess }}
              <component
                :is="getIcon('PartyPopper')"
                :size="13"
                class="text-emerald-500 animate-bounce"
              />
            </span>
          </template>
          <template v-else-if="store.simulationStatus === 'collision'">
            <span class="flex items-center gap-1">
              {{ store.t.simCollision }}
              <component :is="getIcon('Zap')" :size="13" class="text-rose-500 animate-pulse" />
            </span>
          </template>
          <template v-else-if="store.simulationStatus === 'out_of_bounds'">
            <span class="flex items-center gap-1">
              {{ store.t.simOutOfBounds }}
              <component :is="getIcon('Compass')" :size="13" class="text-rose-500" />
            </span>
          </template>
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
            const wasPaused = store.simulationStatus === 'paused';
            wasPaused ? store.resumeSimulation() : store.startSimulation();
            trackEvent('simulation_start', { resumed: wasPaused });
          "
          class="flex items-center justify-center h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm shadow-emerald-500/10 sleek-focus"
          :title="store.simulationStatus === 'paused' ? store.t.simResume : store.t.simStart"
        >
          <Play :size="12" class="fill-current mr-1" />
          <span>{{
            store.simulationStatus === "paused" ? store.t.simResume : store.t.simStart
          }}</span>
        </button>

        <button
          v-else-if="store.simulationStatus === 'running'"
          @click="
            store.pauseSimulation();
            trackEvent('simulation_stop');
          "
          class="flex items-center justify-center h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm shadow-amber-500/10 sleek-focus"
          :title="store.t.simPause"
        >
          <Pause :size="12" class="fill-current mr-1" />
          <span>{{ store.t.simPause }}</span>
        </button>

        <!-- Reset Button -->
        <button
          @click="
            store.resetSimulation();
            trackEvent('simulation_reset');
          "
          class="flex items-center justify-center h-8 w-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/20 sleek-focus"
          :title="store.t.simResetTitle"
          :aria-label="store.t.simResetTitle"
        >
          <RotateCcw :size="13" />
        </button>

        <!-- Solution Solver Button -->
        <button
          v-if="store.hasSolution"
          @click="store.showSolution()"
          class="flex items-center justify-center h-8 w-8 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-primary dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/40 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0 sleek-focus"
          :title="store.t.simSolutionTitle"
          :aria-label="store.t.simSolutionTitle"
        >
          <Lightbulb :size="13" />
        </button>
      </div>

      <!-- Speed selector -->
      <div class="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
        <button
          @click="store.changeSpeed(1500)"
          class="h-7 w-7 rounded-md cursor-pointer flex items-center justify-center transition-colors sleek-focus"
          :class="
            store.simulationSpeed === 1500
              ? 'bg-primary text-white font-bold'
              : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          "
          :title="store.t.speedSlow"
          :aria-label="store.t.speedSlow"
        >
          <Turtle :size="13" />
        </button>
        <button
          @click="store.changeSpeed(800)"
          class="h-7 w-7 rounded-md cursor-pointer flex items-center justify-center transition-colors sleek-focus"
          :class="
            store.simulationSpeed === 800
              ? 'bg-primary text-white font-bold'
              : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          "
          :title="store.t.speedNormal"
          :aria-label="store.t.speedNormal"
        >
          <Gauge :size="13" />
        </button>
        <button
          @click="store.changeSpeed(300)"
          class="h-7 w-7 rounded-md cursor-pointer flex items-center justify-center transition-colors sleek-focus"
          :class="
            store.simulationSpeed === 300
              ? 'bg-primary text-white font-bold'
              : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          "
          :title="store.t.speedFast"
          :aria-label="store.t.speedFast"
        >
          <Zap :size="13" />
        </button>
      </div>
    </div>

    <!-- Inventory Section -->
    <div
      v-if="store.isSimulating && store.simulationInventory.length > 0"
      class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 animate-fade-in"
    >
      <span
        class="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider select-none leading-none"
      >
        {{ store.t.inventory }}
      </span>
      <div class="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 py-1">
        <div
          v-for="(item, idx) in store.simulationInventory"
          :key="idx"
          class="flex items-center justify-center h-7 w-7 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800"
        >
          <component
            v-if="item.type === 'icon'"
            :is="getIcon(item.value)"
            class="w-4.5 h-4.5 text-slate-700 dark:text-slate-300"
            :class="
              item.value === 'Bot'
                ? 'text-emerald-500 dark:text-emerald-400'
                : item.value === 'EvCharger'
                  ? 'text-amber-500 dark:text-amber-400'
                  : ''
            "
          />
          <span v-else class="text-xs font-bold text-slate-700 dark:text-slate-350 select-none">{{
            item.value
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
