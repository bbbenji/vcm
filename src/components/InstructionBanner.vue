<script setup lang="ts">
import { useMatStore } from '../stores/matStore'
import { BookOpen, X } from 'lucide-vue-next'

const store = useMatStore()
</script>

<template>
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
          :aria-label="store.t.cancel"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
