<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { GRID_SIZES, useMatStore } from "../stores/matStore";
import type { GridSize } from "../stores/matStore";
import BaseDialog from "./BaseDialog.vue";
import { buildAiPrompt } from "../utils/aiPrompt";
import { Check, Copy, CircleAlert, FileUp } from "lucide-vue-next";
import { trackEvent } from "../plugins/analytics";

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(["close"]);

const store = useMatStore();
const gridSizes = GRID_SIZES;

const subject = ref("");
const promptSize = ref<GridSize>(store.gridSize);
const aiResponse = ref("");
const isCopied = ref(false);
const importStatus = ref<"idle" | "success" | "error">("idle");
let importTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      promptSize.value = store.gridSize;
      importStatus.value = "idle";
    }
  },
);

const prompt = computed(() =>
  buildAiPrompt(store.lang, subject.value.trim() || "...", promptSize.value),
);

const copyPrompt = async () => {
  if (!subject.value.trim()) return;
  try {
    await navigator.clipboard.writeText(prompt.value);
    isCopied.value = true;
    trackEvent("ai_prompt_copy");
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy", err);
  }
};

const importResponse = () => {
  const success = store.importCoordinatesText(aiResponse.value);
  importStatus.value = success ? "success" : "error";
  trackEvent("ai_import", { success });
  if (importTimer) clearTimeout(importTimer);
  if (success) {
    importTimer = setTimeout(() => {
      aiResponse.value = "";
      emit("close");
    }, 1200);
  } else {
    importTimer = setTimeout(() => {
      importStatus.value = "idle";
    }, 2200);
  }
};
</script>

<template>
  <BaseDialog
    :is-open="isOpen"
    :title="store.t.aiTitle"
    :description="store.t.aiDesc"
    :cancel-text="store.t.aiClose"
    hide-confirm
    size="lg"
    @close="emit('close')"
  >
    <div class="w-full text-left flex flex-col gap-4 mb-6">
      <!-- Step 1: Subject + Grid Size -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 flex flex-col gap-1.5">
          <label
            for="ai-subject"
            class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
          >
            {{ store.t.aiSubjectLabel }}
          </label>
          <input
            id="ai-subject"
            v-model="subject"
            type="text"
            :placeholder="store.t.aiSubjectPlaceholder"
            class="px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 sleek-focus"
          />
        </div>
        <div class="flex flex-col gap-1.5 sm:w-28">
          <label
            for="ai-grid-size"
            class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
          >
            {{ store.t.size.replace(":", "") }}
          </label>
          <select
            id="ai-grid-size"
            v-model.number="promptSize"
            class="px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer font-semibold sleek-focus"
          >
            <option v-for="size in gridSizes" :key="size" :value="size">
              {{ size }}x{{ size }}
            </option>
          </select>
        </div>
      </div>

      <!-- Step 2: Prompt preview + copy -->
      <div class="flex flex-col gap-1.5">
        <label
          for="ai-prompt"
          class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
        >
          {{ store.t.aiPromptLabel }}
        </label>
        <textarea
          id="ai-prompt"
          :value="prompt"
          readonly
          rows="6"
          class="px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-lg text-[11px] font-mono leading-relaxed bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 resize-none sleek-focus"
        ></textarea>
        <button
          @click="copyPrompt"
          :disabled="!subject.trim()"
          class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all text-white active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-primary/10"
          :class="isCopied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-primary hover:bg-primary-hover'"
        >
          <Check v-if="isCopied" :size="14" />
          <Copy v-else :size="14" />
          {{ isCopied ? store.t.copied : store.t.aiCopyPrompt }}
        </button>
      </div>

      <!-- Divider -->
      <div class="h-px bg-slate-100 dark:bg-slate-800"></div>

      <!-- Step 3: Paste AI answer + import -->
      <div class="flex flex-col gap-1.5">
        <label
          for="ai-response"
          class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
        >
          {{ store.t.aiPasteLabel }}
        </label>
        <textarea
          id="ai-response"
          v-model="aiResponse"
          rows="4"
          :placeholder="store.t.aiPastePlaceholder"
          class="px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-lg text-[11px] font-mono leading-relaxed bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 resize-none sleek-focus"
        ></textarea>
        <button
          @click="importResponse"
          :disabled="!aiResponse.trim() || importStatus === 'success'"
          class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all text-white active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-primary/10"
          :class="{
            'bg-emerald-500 hover:bg-emerald-600': importStatus === 'success',
            'bg-rose-500 hover:bg-rose-600': importStatus === 'error',
            'bg-primary hover:bg-primary-hover': importStatus === 'idle',
          }"
        >
          <Check v-if="importStatus === 'success'" :size="14" />
          <CircleAlert v-else-if="importStatus === 'error'" :size="14" />
          <FileUp v-else :size="14" />
          {{
            importStatus === "success"
              ? store.t.importSuccess
              : importStatus === "error"
                ? store.t.importFailed
                : store.t.aiImportBtn
          }}
        </button>
      </div>
    </div>
  </BaseDialog>
</template>
