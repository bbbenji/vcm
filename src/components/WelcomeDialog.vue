<script setup lang="ts">
import { useMatStore } from "../stores/matStore";
import BaseDialog from "./BaseDialog.vue";
import { Palette, Grid3x3, ExternalLink, Check } from "lucide-vue-next";
import { trackEvent } from "../plugins/analytics";

const emit = defineEmits(["close"]);

const store = useMatStore();

const PRODUCT_URL = "https://mamywydruki.pl/produkt/pixel-taca/";

// Closing without picking still counts as answered - a card that returns on
// every load would nag. The default mode simply stands.
const close = () => {
  store.dismissWelcome();
  emit("close");
};

const choose = (simple: boolean) => {
  store.setSimpleMode(simple);
  store.dismissWelcome();
  trackEvent("welcome_choose_mode", { mode: simple ? "simple" : "full" });
  emit("close");
};

const cardClass =
  "group flex flex-col gap-2 w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-primary dark:hover:border-primary hover:shadow-md active:scale-[0.99] sleek-focus";
</script>

<template>
  <BaseDialog
    :is-open="true"
    :title="store.t.welcomeTitle"
    :description="store.t.welcomeIntro"
    hide-confirm
    size="lg"
    @close="close"
  >
    <div class="flex flex-col gap-3 mt-1 text-left">
      <!-- Simple mode: pairs with the Pixel Taca tray -->
      <button :class="cardClass" @click="choose(true)">
        <span class="flex items-center gap-2.5">
          <span
            class="flex items-center justify-center h-9 w-9 shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-primary dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40"
          >
            <Palette :size="18" />
          </span>
          <span class="font-bold text-base">{{ store.t.welcomeSimpleTitle }}</span>
          <span
            class="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border bg-indigo-50 dark:bg-indigo-950/30 border-indigo-250 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400"
          >
            <Check :size="11" class="stroke-[3]" />
            {{ store.lang === "pl" ? "Zalecany" : "Recommended" }}
          </span>
        </span>
        <span class="text-sm text-slate-600 dark:text-slate-300 leading-snug">
          {{ store.t.welcomeSimpleDesc }}
        </span>
        <span class="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 leading-snug">
          <span>· {{ store.t.welcomeSimpleHint1 }}</span>
          <span>· {{ store.t.welcomeSimpleHint2 }}</span>
        </span>
      </button>

      <!-- Full mat: everything the app has always had -->
      <button :class="cardClass" @click="choose(false)">
        <span class="flex items-center gap-2.5">
          <span
            class="flex items-center justify-center h-9 w-9 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          >
            <Grid3x3 :size="18" />
          </span>
          <span class="font-bold text-base">{{ store.t.welcomeFullTitle }}</span>
        </span>
        <span class="text-sm text-slate-600 dark:text-slate-300 leading-snug">
          {{ store.t.welcomeFullDesc }}
        </span>
      </button>

      <a
        :href="PRODUCT_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors py-1 sleek-focus rounded"
      >
        {{ store.t.welcomeProduct }}
        <ExternalLink :size="12" />
      </a>
    </div>
  </BaseDialog>
</template>
