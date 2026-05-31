<script setup lang="ts">
import { ref } from 'vue'
import { GRID_SIZES, useMatStore } from '../stores/matStore'
import {
  Download,
  Trash2,
  Undo2,
  ChevronDown,
  Image,
  FileText,
  FileCode,
  Link2,
  Check,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Languages,
} from 'lucide-vue-next'

const store = useMatStore()
const gridSizes = GRID_SIZES
const showDownloadMenu = ref(false)
const isCopied = ref(false)

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}

const onSizeChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  store.initBoard(Number(target.value))
}

const downloadImage = async () => {
  const matEl = document.getElementById('mat-grid-container')
  if (!matEl) return
  try {
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(matEl, {
      pixelRatio: 2,
      backgroundColor: store.isDarkMode ? '#0b0f19' : '#ffffff',
      filter: (node) => {
        if (node instanceof HTMLElement && node.getAttribute('data-html2canvas-ignore') === 'true') {
          return false
        }
        return true
      }
    })
    const link = document.createElement('a')
    link.download = `${store.t.title.toLowerCase().replace(/\s+/g, '-')}.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Error downloading image', error)
  }
}

const downloadPdf = async () => {
  const matEl = document.getElementById('mat-grid-container')
  if (!matEl) return
  try {
    const [{ toPng }, { default: jsPDF }] = await Promise.all([
      import('html-to-image'),
      import('jspdf'),
    ])
    const dataUrl = await toPng(matEl, {
      pixelRatio: 2,
      backgroundColor: store.isDarkMode ? '#0b0f19' : '#ffffff',
      filter: (node) => {
        if (node instanceof HTMLElement && node.getAttribute('data-html2canvas-ignore') === 'true') {
          return false
        }
        return true
      }
    })

    // A4 size in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const imgProps = pdf.getImageProperties(dataUrl)
    const pdfWidth = pdf.internal.pageSize.getWidth()

    // Add image with 10mm margin, adjusting width/height to fit ratio
    const margin = 10
    const printWidth = pdfWidth - margin * 2
    const printHeight = (imgProps.height * printWidth) / imgProps.width

    pdf.addImage(dataUrl, 'PNG', margin, margin, printWidth, printHeight)
    pdf.save(`${store.t.title.toLowerCase().replace(/\s+/g, '-')}.pdf`)
  } catch (error) {
    console.error('Error downloading PDF', error)
  }
}

const downloadCoordinates = () => {
  const text = store.getCoordinatesText()
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const link = document.createElement('a')
  link.download = `${store.t.title.toLowerCase().replace(/\s+/g, '-')}-coords.txt`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

const closeDownloadMenu = () => {
  showDownloadMenu.value = false
}

const handleImageDownload = async () => {
  closeDownloadMenu()
  await downloadImage()
}

const handlePdfDownload = async () => {
  closeDownloadMenu()
  await downloadPdf()
}

const handleCoordinatesDownload = () => {
  closeDownloadMenu()
  downloadCoordinates()
}
</script>

<template>
  <header
    class="flex flex-row justify-between items-center p-3 md:p-4 md:px-8 bg-white/90 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800/80 backdrop-blur-md sticky top-0 z-40 gap-2 select-none shadow-sm transition-colors duration-300"
  >
    <!-- Logo Title -->
    <div class="flex items-center shrink-0">
      <h1 class="text-base md:text-2xl font-bold bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent tracking-tight m-0 font-heading">
        {{ store.t.title }}
      </h1>
    </div>

    <!-- Center/Right Action Menu -->
    <div class="flex items-center gap-1.5 sm:gap-2.5 md:gap-4 py-0.5">
      <!-- Grid Size Selection -->
      <div class="flex items-center gap-1 md:gap-2 font-medium shrink-0">
        <label for="grid-size" class="hidden md:inline text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold">{{ store.t.size }}</label>
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
        @click="store.clearBoard"
        :title="store.t.clear"
        class="flex items-center gap-1 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 active:scale-95 cursor-pointer shrink-0"
      >
        <Trash2 :size="16" class="md:w-[18px] md:h-[18px]" />
        <span class="hidden sm:inline">{{ store.t.clear }}</span>
      </button>

      <!-- Share Action -->
      <button
        @click="copyUrl"
        :title="store.t.share"
        class="flex items-center gap-1 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 active:scale-95 cursor-pointer shrink-0"
      >
        <Check v-if="isCopied" :size="16" class="md:w-[18px] md:h-[18px] text-emerald-500" />
        <Link2 v-else :size="16" class="md:w-[18px] md:h-[18px]" />
        <span class="hidden sm:inline">{{ isCopied ? store.t.copied : store.t.share }}</span>
        <span v-if="isCopied" class="sm:hidden text-emerald-500 font-bold">✓</span>
      </button>

      <!-- Download Action -->
      <div class="relative shrink-0">
        <button
          @click="showDownloadMenu = !showDownloadMenu"
          :title="store.t.download"
          class="flex items-center gap-1 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all bg-primary text-white hover:bg-primary-hover active:scale-95 cursor-pointer shadow-sm shadow-primary/20"
        >
          <Download :size="16" class="md:w-[18px] md:h-[18px]" />
          <span class="hidden sm:inline">{{ store.t.download }}</span>
          <ChevronDown :size="14" class="md:w-[16px] md:h-[16px]" />
        </button>

        <!-- Invisible overlay to catch clicks outside the menu -->
        <div
          v-if="showDownloadMenu"
          class="fixed inset-0 z-40"
          @click="showDownloadMenu = false"
        ></div>

        <div
          v-if="showDownloadMenu"
          class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700/80 py-1 z-50 flex flex-col overflow-hidden animate-fade-in"
        >
          <button
            @click="handleImageDownload"
            class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium text-left w-full transition-colors border-b border-slate-50 dark:border-slate-700/50 cursor-pointer"
          >
            <Image :size="18" class="text-primary" /> {{ store.t.downloadPng }}
          </button>
          <button
            @click="handlePdfDownload"
            class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium text-left w-full transition-colors border-b border-slate-50 dark:border-slate-700/50 cursor-pointer"
          >
            <FileText :size="18" class="text-emerald-500" /> {{ store.t.downloadPdf }}
          </button>
          <button
            @click="handleCoordinatesDownload"
            class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium text-left w-full transition-colors cursor-pointer"
          >
            <FileCode :size="18" class="text-slate-500 dark:text-slate-400" /> {{ store.t.downloadTxt }}
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 shrink-0"></div>

      <!-- Premium Utilities (Language, Sound, DarkMode) -->
      <div class="flex items-center gap-1 sm:gap-1.5">
        <!-- Language Switcher -->
        <button
          @click="store.toggleLanguage"
          class="flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-all active:scale-95 cursor-pointer"
          :title="`Toggle language to ${store.lang === 'pl' ? 'English' : 'Polski'}`"
        >
          <Languages :size="18" />
        </button>

        <!-- Sound Effects Toggle -->
        <button
          @click="store.toggleSound"
          class="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
          :class="store.soundEnabled ? 'text-primary dark:text-primary' : 'text-slate-400 dark:text-slate-500'"
          :title="`${store.t.soundToggle}: ${store.soundEnabled ? 'ON' : 'OFF'}`"
        >
          <Volume2 v-if="store.soundEnabled" :size="18" />
          <VolumeX v-else :size="18" />
        </button>

        <!-- Dark/Light Mode Toggler -->
        <button
          @click="store.toggleTheme"
          class="flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-all active:scale-95 cursor-pointer"
          :title="store.t.themeToggle"
        >
          <Sun v-if="store.isDarkMode" :size="18" class="text-amber-500 animate-spin-slow" />
          <Moon v-else :size="18" class="text-indigo-500" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 8s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
