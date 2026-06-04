<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useMatStore } from "../stores/matStore";
import { showCookiePreferences } from "../plugins/analytics";
import { Sun, Moon, Volume2, VolumeX, Languages, Settings, Eye, EyeOff, Cookie } from "lucide-vue-next";

const store = useMatStore();
const showSettingsMenu = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (showSettingsMenu.value && dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showSettingsMenu.value = false;
  }
};

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="relative shrink-0" ref="dropdownRef">
    <button
      @click="showSettingsMenu = !showSettingsMenu"
      title="Ustawienia / Settings"
      class="flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-all active:scale-95 cursor-pointer shrink-0"
    >
      <Settings :size="18" />
    </button>

    <!-- Settings preferences floating card -->
    <div
      v-if="showSettingsMenu"
      class="fixed right-3 md:right-8 top-[56px] md:top-[70px] mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700/80 py-1.5 z-50 flex flex-col overflow-hidden animate-fade-in"
    >
      <!-- Title / Header inside menu -->
      <div
        class="px-4 py-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-50 dark:border-slate-700/30 mb-1"
      >
        {{ store.lang === "pl" ? "Ustawienia" : "Settings" }}
      </div>

      <!-- Language Selector Row -->
      <button
        @click="store.toggleLanguage"
        class="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer text-left"
      >
        <span class="flex items-center gap-2.5">
          <Languages :size="16" class="text-indigo-500" />
          {{ store.lang === "pl" ? "Język" : "Language" }}
        </span>
        <span
          class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 text-slate-500 dark:text-slate-400"
        >
          {{ store.lang }}
        </span>
      </button>

      <!-- Sound Effects Toggle Row -->
      <button
        @click="store.toggleSound"
        class="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer text-left"
      >
        <span class="flex items-center gap-2.5">
          <Volume2 v-if="store.soundEnabled" :size="16" class="text-emerald-500" />
          <VolumeX v-else :size="16" class="text-slate-400 dark:text-slate-500" />
          {{ store.lang === "pl" ? "Dźwięki" : "Sounds" }}
        </span>
        <span
          class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border"
          :class="
            store.soundEnabled
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-250 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-slate-900 border-slate-250 dark:border-slate-700 text-slate-400 dark:text-slate-500'
          "
        >
          {{ store.soundEnabled ? "ON" : "OFF" }}
        </span>
      </button>

      <!-- Secondary Grid Toggle Row -->
      <button
        @click="store.showSecondaryGrid = !store.showSecondaryGrid"
        class="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer text-left"
      >
        <span class="flex items-center gap-2.5">
          <component
            :is="store.showSecondaryGrid ? Eye : EyeOff"
            :size="16"
            class="text-indigo-500"
          />
          {{ store.lang === "pl" ? "Dolna plansza" : "Instruction queue" }}
        </span>
        <span
          class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border"
          :class="
            store.showSecondaryGrid
              ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-250 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400'
              : 'bg-slate-100 dark:bg-slate-900 border-slate-250 dark:border-slate-700 text-slate-400 dark:text-slate-500'
          "
        >
          {{
            store.showSecondaryGrid
              ? store.lang === "pl"
                ? "WIDOCZNA"
                : "SHOWN"
              : store.lang === "pl"
                ? "UKRYTA"
                : "HIDDEN"
          }}
        </span>
      </button>

      <!-- Theme Toggle Row -->
      <button
        @click="store.toggleTheme"
        class="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer text-left"
      >
        <span class="flex items-center gap-2.5">
          <Sun v-if="store.isDarkMode" :size="16" class="text-amber-500 animate-spin-slow" />
          <Moon v-else :size="16" class="text-indigo-500" />
          {{ store.lang === "pl" ? "Motyw" : "Theme" }}
        </span>
        <span
          class="text-[10px] capitalize font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 text-slate-500 dark:text-slate-400"
        >
          {{
            store.isDarkMode
              ? store.lang === "pl"
                ? "Ciemny"
                : "Dark"
              : store.lang === "pl"
                ? "Jasny"
                : "Light"
          }}
        </span>
      </button>
      <!-- Cookie Consent Row -->
      <button
        @click="showCookiePreferences(); showSettingsMenu = false;"
        class="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer text-left border-t border-slate-50 dark:border-slate-700/30"
      >
        <span class="flex items-center gap-2.5">
          <Cookie :size="16" class="text-orange-500" />
          {{ store.lang === "pl" ? "Ciasteczka" : "Cookies" }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 8s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
