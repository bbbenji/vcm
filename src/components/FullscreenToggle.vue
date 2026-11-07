<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useMatStore } from "../stores/matStore";
import { Maximize, Minimize } from "lucide-vue-next";
import { trackEvent } from "../plugins/analytics";

const store = useMatStore();
const isFullscreen = ref(false);

// iOS Safari on iPhone has no Fullscreen API - render nothing rather than a dead button.
const isSupported = ref(false);

const label = computed(() => (isFullscreen.value ? store.t.exitFullscreen : store.t.fullscreen));

const syncState = () => {
  isFullscreen.value = Boolean(document.fullscreenElement);
};

const toggleFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
    trackEvent("toggle_fullscreen", { enabled: Boolean(document.fullscreenElement) });
  } catch {
    // The browser can refuse the request (no user gesture, embedded in an iframe,
    // permission policy). Nothing to recover - just keep the icon honest.
    syncState();
  }
};

onMounted(() => {
  isSupported.value = typeof document.documentElement.requestFullscreen === "function";
  syncState();
  // Esc and the browser's own UI change fullscreen without touching our button.
  document.addEventListener("fullscreenchange", syncState);
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", syncState);
});
</script>

<template>
  <button
    v-if="isSupported"
    @click="toggleFullscreen"
    :title="label"
    :aria-label="label"
    :aria-pressed="isFullscreen"
    class="flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-all active:scale-95 cursor-pointer shrink-0 sleek-focus"
  >
    <component :is="isFullscreen ? Minimize : Maximize" :size="18" />
  </button>
</template>
