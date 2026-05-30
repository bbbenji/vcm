<script setup lang="ts">
import HeaderControls from './components/HeaderControls.vue'
import MatGrid from './components/MatGrid.vue'
import AssetLibrary from './components/AssetLibrary.vue'
</script>

<template>
  <div class="flex flex-col h-dvh overflow-hidden">
    <HeaderControls />
    <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
      <main class="flex-1 relative overflow-hidden">
        <MatGrid />
      </main>
      <AssetLibrary />
    </div>
  </div>
</template>
