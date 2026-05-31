<script setup lang="ts">
import { ref } from "vue";
import { useMatStore } from "../stores/matStore";
import {
  Download,
  ChevronDown,
  Image,
  FileText,
  FileCode,
} from "lucide-vue-next";

const store = useMatStore();
const showDownloadMenu = ref(false);

const downloadImage = async () => {
  const matEl = document.getElementById("mat-grid-container");
  if (!matEl) return;
  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(matEl, {
      pixelRatio: 2,
      backgroundColor: store.isDarkMode ? "#0b0f19" : "#ffffff",
      filter: (node) => {
        if (
          node instanceof HTMLElement &&
          node.getAttribute("data-html2canvas-ignore") === "true"
        ) {
          return false;
        }
        return true;
      },
    });
    const link = document.createElement("a");
    link.download = `${store.t.title.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Error downloading image", error);
  }
};

const downloadPdf = async () => {
  const matEl = document.getElementById("mat-grid-container");
  if (!matEl) return;
  try {
    const [{ toPng }, { default: jsPDF }] = await Promise.all([
      import("html-to-image"),
      import("jspdf"),
    ]);
    const dataUrl = await toPng(matEl, {
      pixelRatio: 2,
      backgroundColor: store.isDarkMode ? "#0b0f19" : "#ffffff",
      filter: (node) => {
        if (
          node instanceof HTMLElement &&
          node.getAttribute("data-html2canvas-ignore") === "true"
        ) {
          return false;
        }
        return true;
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();

    const margin = 10;
    const printWidth = pdfWidth - margin * 2;
    const printHeight = (imgProps.height * printWidth) / imgProps.width;

    pdf.addImage(dataUrl, "PNG", margin, margin, printWidth, printHeight);
    pdf.save(`${store.t.title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  } catch (error) {
    console.error("Error downloading PDF", error);
  }
};

const downloadCoordinates = () => {
  const text = store.getCoordinatesText();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.download = `${store.t.title.toLowerCase().replace(/\s+/g, "-")}-coords.txt`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
};

const handleImageDownload = async () => {
  showDownloadMenu.value = false;
  await downloadImage();
};

const handlePdfDownload = async () => {
  showDownloadMenu.value = false;
  await downloadPdf();
};

const handleCoordinatesDownload = () => {
  showDownloadMenu.value = false;
  downloadCoordinates();
};
</script>

<template>
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
      class="fixed right-3 md:right-8 top-[56px] md:top-[70px] mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700/80 py-1 z-50 flex flex-col overflow-hidden animate-fade-in"
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
        <FileCode :size="18" class="text-slate-500 dark:text-slate-400" />
        {{ store.t.downloadTxt }}
      </button>
    </div>
  </div>
</template>
