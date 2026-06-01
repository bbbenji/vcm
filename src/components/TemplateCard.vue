<script setup lang="ts">
import { Trash2 } from "lucide-vue-next";

defineProps<{
  tpl: {
    id: string;
    size: number;
    name?: string;
    desc?: string;
    type?: string;
    createdAt?: number;
  };
  isCustom: boolean;
  getTemplateName: (tpl: { id: string; name?: string; desc?: string }) => string;
  getTemplateDesc: (tpl: { id: string; name?: string; desc?: string }) => string;
  loadLabel: string;
  patternLabel?: string;
  taskLabel?: string;
}>();

defineEmits<{
  (e: "load"): void;
  (e: "delete", id: string): void;
}>();
</script>

<template>
  <div
    @click="$emit('load')"
    class="flex flex-col text-left p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-950/90 hover:border-slate-350 dark:hover:border-slate-700/80 transition-all cursor-pointer shadow-sm select-none relative group"
  >
    <!-- Title and badges row -->
    <div class="flex justify-between items-start gap-2 w-full">
      <div class="flex flex-col gap-1 min-w-0">
        <span
          class="font-bold text-slate-800 dark:text-slate-100 text-xs md:text-sm tracking-tight leading-tight truncate"
          :title="getTemplateName(tpl)"
        >
          {{ getTemplateName(tpl) }}
        </span>
        <span
          v-if="isCustom && tpl.createdAt"
          class="text-[8px] text-slate-400 dark:text-slate-500 font-semibold select-none"
        >
          {{ new Date(tpl.createdAt).toLocaleDateString() }}
        </span>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <!-- Badge -->
        <span
          v-if="isCustom"
          class="text-[8px] md:text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none bg-indigo-50 dark:bg-indigo-950/40 text-primary dark:text-indigo-400"
        >
          {{ tpl.size }}x{{ tpl.size }}
        </span>
        <span
          v-else-if="tpl.type"
          class="text-[8px] md:text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none shrink-0"
          :class="
            tpl.type === 'premade'
              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
          "
        >
          {{ tpl.type === 'premade' ? patternLabel : taskLabel }}
        </span>

        <!-- Delete button (Custom Mats only) -->
        <button
          v-if="isCustom"
          @click.stop="$emit('delete', tpl.id)"
          class="h-7 w-7 rounded-lg border border-transparent hover:border-rose-100 dark:hover:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 dark:text-rose-400 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Delete"
        >
          <component :is="Trash2" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Description -->
    <p
      v-if="getTemplateDesc(tpl)"
      class="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-normal break-words"
    >
      {{ getTemplateDesc(tpl) }}
    </p>

    <!-- Load Trigger -->
    <span
      class="text-[10px] text-primary group-hover:text-primary-hover font-bold mt-3 flex items-center gap-1.5 transition-all text-left w-max duration-200 transform group-hover:translate-x-1"
    >
      {{ loadLabel }} <span v-if="!isCustom">({{ tpl.size }}x{{ tpl.size }})</span> &rarr;
    </span>
  </div>
</template>
