<script setup lang="ts">
import HeaderControls from './components/HeaderControls.vue'
import MatGrid from './components/MatGrid.vue'
import AssetLibrary from './components/AssetLibrary.vue'
import { useMatStore } from './stores/matStore'

const store = useMatStore()
</script>

<template>
  <div 
    class="flex flex-col h-dvh overflow-hidden bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans"
    :class="{ 'dark': store.isDarkMode }"
  >
    <HeaderControls />
    <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
      <main class="flex-1 relative overflow-hidden bg-slate-50 dark:bg-[#0b0f19]">
        <MatGrid />
      </main>
      <AssetLibrary />
    </div>
  </div>
</template>
