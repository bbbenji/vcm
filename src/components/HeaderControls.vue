<script setup lang="ts">
import { ref } from "vue";
import { GRID_SIZES, useMatStore } from "../stores/matStore";
import { Trash2, Undo2, Save } from "lucide-vue-next";
import ShareDropdown from "./ShareDropdown.vue";
import SettingsDropdown from "./SettingsDropdown.vue";
import BaseDialog from "./BaseDialog.vue";
import { trackEvent } from "../plugins/analytics";

const store = useMatStore();
const gridSizes = GRID_SIZES;
const isClearDialogOpen = ref(false);

const triggerSaveMat = () => {
  store.activeTab = "my_mats";
  store.isCollapsed = false;
  store.showSaveForm = true;
  trackEvent("save_template");
};

const onSizeChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  store.initBoard(Number(target.value));
};

const confirmClear = () => {
  isClearDialogOpen.value = true;
};

const executeClear = () => {
  store.clearBoard();
  trackEvent("clear_mat");
};
</script>

<template>
  <header
    class="flex flex-row justify-between items-center p-3 md:p-4 md:px-8 bg-white/90 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800/80 backdrop-blur-md sticky top-0 z-40 gap-2 select-none shadow-sm transition-colors duration-300"
  >
    <!-- Logo Title -->
    <div class="flex items-center shrink-0">
      <picture>
        <source srcset="/icon.svg" media="(max-width: 639px)" />
        <img
          src="/logo.svg"
          alt="Mamy Wydruki Logo"
          class="h-6 sm:h-8 md:h-10 w-auto dark:invert dark:brightness-150 transition-all"
        />
      </picture>
    </div>

    <!-- Center/Right Action Menu -->
    <div
      class="flex flex-row flex-nowrap items-center gap-1.5 sm:gap-2.5 md:gap-4 py-0.5 max-w-full overflow-x-auto scrollbar-none ml-auto"
    >
      <!-- Grid Size Selection -->
      <div class="flex items-center gap-1 md:gap-2 font-medium shrink-0">
        <label
          for="grid-size"
          class="hidden md:inline text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold"
          >{{ store.t.size }}</label
        >
        <select
          id="grid-size"
          :value="store.gridSize"
          @change="onSizeChange"
          class="px-2 py-1 md:px-3 md:py-2 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs md:text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer font-semibold"
        >
          <option v-for="size in gridSizes" :key="size" :value="size">{{ size }}x{{ size }}</option>
        </select>
      </div>

      <!-- Undo Action -->
      <button
        @click="store.undo"
        :disabled="store.history.length === 0"
        :title="store.t.undo"
        class="flex items-center gap-1 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer shrink-0"
      >
        <Undo2 :size="16" class="md:w-[18px] md:h-[18px]" />
        <span class="hidden sm:inline">{{ store.t.undo }}</span>
      </button>

      <!-- Clear Action -->
      <button
        @click="confirmClear"
        :title="store.t.clear"
        class="flex items-center gap-1 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 active:scale-95 cursor-pointer shrink-0"
      >
        <Trash2 :size="16" class="md:w-[18px] md:h-[18px]" />
        <span class="hidden sm:inline">{{ store.t.clear }}</span>
      </button>

      <!-- Save Action -->
      <button
        @click="triggerSaveMat"
        :title="store.t.saveMat"
        class="flex items-center gap-1 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all bg-indigo-50 dark:bg-indigo-950/30 text-primary dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 active:scale-95 cursor-pointer shrink-0"
      >
        <Save :size="16" class="md:w-[18px] md:h-[18px]" />
        <span class="hidden sm:inline">{{ store.t.saveMat }}</span>
      </button>

      <!-- Share & Export Actions -->
      <ShareDropdown />

      <!-- Divider -->
      <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 shrink-0"></div>

      <!-- Settings Dropdown -->
      <SettingsDropdown />
    </div>
  </header>

  <!-- Clear Confirmation Dialog Modal -->
  <BaseDialog
    :is-open="isClearDialogOpen"
    :title="store.t.clear"
    :description="store.t.clearConfirm"
    :confirm-text="store.t.clear"
    :cancel-text="store.t.cancel"
    confirm-variant="rose"
    icon-type="clear"
    @confirm="executeClear"
    @close="isClearDialogOpen = false"
  />
</template>
