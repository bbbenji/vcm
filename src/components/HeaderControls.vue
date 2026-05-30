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
      backgroundColor: '#ffffff',
    })
    const link = document.createElement('a')
    link.download = 'wirtualna-mata.png'
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
      backgroundColor: '#ffffff',
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
    pdf.save('wirtualna-mata.pdf')
  } catch (error) {
    console.error('Error downloading PDF', error)
  }
}

const downloadCoordinates = () => {
  const text = store.getCoordinatesText()
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const link = document.createElement('a')
  link.download = 'wirtualna-mata-koordynaty.txt'
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
    class="flex flex-row justify-between items-center p-3 md:p-4 md:px-8 bg-white shadow-sm sticky top-0 z-10 gap-2 select-none"
  >
    <div class="flex items-center shrink-0">
      <h1 class="text-base md:text-2xl font-bold text-primary tracking-tight m-0">Wirtualna Mata</h1>
    </div>

    <div class="flex items-center gap-1.5 md:gap-4 overflow-x-auto scrollbar-none py-0.5">
      <div class="flex items-center gap-1 md:gap-2 font-medium shrink-0">
        <label for="grid-size" class="hidden sm:inline text-xs md:text-sm">Rozmiar:</label>
        <select
          id="grid-size"
          :value="store.gridSize"
          @change="onSizeChange"
          class="px-2 py-1 md:px-4 md:py-2 border border-slate-200 rounded-lg text-xs md:text-sm bg-slate-50 text-slate-800 outline-none focus:border-primary transition-colors cursor-pointer"
        >
          <option v-for="size in gridSizes" :key="size" :value="size">{{ size }}x{{ size }}</option>
        </select>
      </div>

      <button
        @click="store.undo"
        :disabled="store.history.length === 0"
        title="Cofnij (Undo)"
        class="flex items-center gap-1 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all bg-slate-100 text-slate-700 hover:bg-slate-200 active:translate-y-0 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer shrink-0"
      >
        <Undo2 :size="16" class="md:w-[18px] md:h-[18px]" />
        <span class="hidden sm:inline">Cofnij</span>
      </button>

      <button
        @click="store.clearBoard"
        title="Wyczyść matę"
        class="flex items-center gap-1 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all bg-red-100 text-red-500 hover:bg-red-300 hover:text-red-700 active:translate-y-0 hover:-translate-y-0.5 cursor-pointer shrink-0"
      >
        <Trash2 :size="16" class="md:w-[18px] md:h-[18px]" />
        <span class="hidden sm:inline">Wyczyść</span>
      </button>

      <button
        @click="copyUrl"
        title="Udostępnij (Kopiuj Link)"
        class="flex items-center gap-1 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:translate-y-0 hover:-translate-y-0.5 cursor-pointer shrink-0"
      >
        <Check v-if="isCopied" :size="16" class="md:w-[18px] md:h-[18px]" />
        <Link2 v-else :size="16" class="md:w-[18px] md:h-[18px]" />
        <span class="hidden sm:inline">{{ isCopied ? 'Skopiowano' : 'Udostępnij' }}</span>
        <span v-if="isCopied" class="sm:hidden text-emerald-600 font-bold">✓</span>
      </button>

      <div class="relative shrink-0">
        <button
          @click="showDownloadMenu = !showDownloadMenu"
          title="Pobierz matę"
          class="flex items-center gap-1 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all bg-primary text-white hover:bg-primary-hover hover:shadow-md hover:shadow-blue-500/25 active:translate-y-0 hover:-translate-y-0.5 cursor-pointer"
        >
          <Download :size="16" class="md:w-[18px] md:h-[18px]" />
          <span class="hidden sm:inline">Pobierz</span>
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
          class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 flex flex-col overflow-hidden"
        >
          <button
            @click="handleImageDownload"
            class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 text-sm font-medium text-left w-full transition-colors border-b border-slate-50 cursor-pointer"
          >
            <Image :size="18" class="text-primary" /> Obrazek (PNG)
          </button>
          <button
            @click="handlePdfDownload"
            class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 text-sm font-medium text-left w-full transition-colors border-b border-slate-50 cursor-pointer"
          >
            <FileText :size="18" class="text-emerald-500" /> Dokument (PDF)
          </button>
          <button
            @click="handleCoordinatesDownload"
            class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 text-sm font-medium text-left w-full transition-colors cursor-pointer"
          >
            <FileCode :size="18" class="text-slate-500" /> Koordynaty (TXT)
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
