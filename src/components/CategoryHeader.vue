<script setup lang="ts">
import { getIcon } from "../utils/icons";

defineProps<{
  icon: string;
  title: string;
  count?: number;
  countClass?: string;
}>();
</script>

<template>
  <div
    class="flex items-center gap-2 px-1 border-b border-slate-100 dark:border-slate-800/60 pb-1.5 mt-3 select-none"
  >
    <component
      :is="getIcon(icon)"
      :size="13"
      class="text-slate-400 dark:text-slate-500 shrink-0"
    />
    <span
      class="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
    >
      {{ title }}
    </span>
    <span
      v-if="count !== undefined"
      class="text-[8px] font-bold px-1.5 py-0.25 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ml-auto"
      :class="countClass"
    >
      {{ count }}
    </span>
  </div>
</template>
