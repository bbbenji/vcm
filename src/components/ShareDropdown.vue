<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useMatStore } from "../stores/matStore";
import {
  Share2,
  ChevronDown,
  Link2,
  Check,
  FileUp,
  CircleAlert,
  Image,
  FileText,
  FileCode,
  Printer,
} from "lucide-vue-next";
import { trackEvent } from "../plugins/analytics";
import { exportMatPng, exportMatPdf, printMatPdf } from "../utils/matPdf";

const store = useMatStore();
const showMenu = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (showMenu.value && dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showMenu.value = false;
  }
};

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside);
});

// Share Link State
const isCopied = ref(false);

// Import State
const fileInputRef = ref<HTMLInputElement | null>(null);
const importStatus = ref<"idle" | "success" | "error">("idle");
let importTimer: ReturnType<typeof setTimeout> | null = null;

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    isCopied.value = true;
    trackEvent("share_link_copy");
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy", err);
  }
};

const setImportStatus = (status: typeof importStatus.value) => {
  importStatus.value = status;
  if (importTimer) clearTimeout(importTimer);
  if (status !== "idle") {
    importTimer = setTimeout(() => {
      importStatus.value = "idle";
      importTimer = null;
    }, 2200);
  }
};

const chooseFile = () => {
  fileInputRef.value?.click();
};

const importFile = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const success = store.importCoordinatesText(text);
    setImportStatus(success ? "success" : "error");
    trackEvent("import_txt", { success });
  } catch (error) {
    console.error("Error importing coordinates", error);
    setImportStatus("error");
  } finally {
    input.value = "";
  }
};

// Export/Download Logic
const baseFileName = () => store.t.title.toLowerCase().replace(/\s+/g, "-");

const downloadImage = async () => {
  try {
    await exportMatPng(`${baseFileName()}.png`);
    trackEvent("export_image");
  } catch (error) {
    console.error("Error downloading image", error);
  }
};

const pdfCopy = () => ({
  cta: store.t.printCta,
  exact: store.t.printNoteExact,
  scaled: store.t.printNoteScaled,
});

const downloadPdf = async () => {
  try {
    await exportMatPdf(`${baseFileName()}.pdf`, { cta: store.t.printCta });
    trackEvent("export_pdf");
  } catch (error) {
    console.error("Error downloading PDF", error);
  }
};

// Opens a 1:1 scale PDF (15mm cells, matching the 3D printed mat) in a new tab.
// printMatPdf opens the tab only after the capture finishes - see its comment.
const printActualSize = async () => {
  try {
    const outcome = await printMatPdf(`${baseFileName()}-1-1.pdf`, pdfCopy());
    trackEvent("print_actual_size", { grid_size: store.gridSize, outcome });
  } catch (error) {
    console.error("Error preparing print", error);
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
  trackEvent("export_txt");
};

const handleImageDownload = async () => {
  showMenu.value = false;
  await downloadImage();
};

const handlePdfDownload = async () => {
  showMenu.value = false;
  await downloadPdf();
};

const handlePrint = async () => {
  showMenu.value = false;
  await printActualSize();
};

const handleCoordinatesDownload = () => {
  showMenu.value = false;
  downloadCoordinates();
};
</script>

<template>
  <div class="relative shrink-0" ref="dropdownRef">
    <!-- Trigger Button -->
    <button
      @click="showMenu = !showMenu"
      :title="store.t.shareExport"
      class="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl font-bold text-xs md:text-sm transition-all bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer shadow-sm shadow-primary/20 shrink-0"
    >
      <Share2 :size="16" class="md:w-[18px] md:h-[18px]" />
      <span class="hidden sm:inline">{{ store.t.shareExport }}</span>
      <ChevronDown
        :size="14"
        class="md:w-[16px] md:h-[16px] transition-transform duration-250"
        :class="{ 'rotate-180': showMenu }"
      />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="showMenu"
      class="fixed right-3 md:right-8 top-[56px] md:top-[70px] mt-2 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-2xl py-1.5 z-50 flex flex-col overflow-hidden animate-fade-in"
    >
      <!-- SECTION: Share & Import -->
      <div
        class="px-3 py-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1"
      >
        {{ store.lang === "pl" ? "Udostępnianie" : "Sharing" }}
      </div>

      <!-- Share Option -->
      <button
        @click="copyUrl"
        class="flex items-center justify-between mx-1 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
        :class="
          isCopied
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
        "
      >
        <span class="flex items-center gap-2.5">
          <Check v-if="isCopied" :size="16" class="text-emerald-500" />
          <Link2 v-else :size="16" class="text-indigo-500" />
          {{ isCopied ? store.t.copied : store.t.share }}
        </span>
        <span
          v-if="isCopied"
          class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 animate-pulse-glow"
        >
          OK
        </span>
      </button>

      <!-- Import Option -->
      <div class="relative w-full">
        <input
          ref="fileInputRef"
          type="file"
          accept=".txt,text/plain"
          class="hidden"
          @change="importFile"
        />
        <button
          @click="chooseFile"
          class="flex items-center justify-between w-[calc(100%-8px)] mx-1 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
          :class="{
            'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400':
              importStatus === 'success',
            'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400':
              importStatus === 'error',
            'hover:bg-slate-50 dark:hover:bg-slate-800': importStatus === 'idle',
          }"
        >
          <span class="flex items-center gap-2.5">
            <Check v-if="importStatus === 'success'" :size="16" class="text-emerald-500" />
            <CircleAlert v-else-if="importStatus === 'error'" :size="16" class="text-rose-500" />
            <FileUp v-else :size="16" class="text-cyan-500" />
            {{
              importStatus === "success"
                ? store.t.importSuccess
                : importStatus === "error"
                  ? store.t.importFailed
                  : store.t.importTxt
            }}
          </span>
          <span
            v-if="importStatus !== 'idle'"
            class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded"
            :class="
              importStatus === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
            "
          >
            {{ importStatus === "success" ? "OK" : "ERR" }}
          </span>
        </button>
      </div>

      <!-- Divider -->
      <div class="h-px bg-slate-100 dark:bg-slate-850 my-1.5"></div>

      <!-- SECTION: Export / Download -->
      <div
        class="px-3 py-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1"
      >
        {{ store.lang === "pl" ? "Eksportuj / Pobierz" : "Export / Download" }}
      </div>

      <!-- PNG Image -->
      <button
        @click="handleImageDownload"
        class="flex items-center gap-2.5 mx-1 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
      >
        <Image :size="16" class="text-indigo-500" />
        {{ store.t.downloadPng }}
      </button>

      <!-- PDF Document -->
      <button
        @click="handlePdfDownload"
        class="flex items-center gap-2.5 mx-1 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
      >
        <FileText :size="16" class="text-emerald-500" />
        {{ store.t.downloadPdf }}
      </button>

      <!-- 1:1 Print (matches the 3D printed mat) -->
      <button
        @click="handlePrint"
        class="flex items-center gap-2.5 mx-1 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
      >
        <Printer :size="16" class="text-rose-500" />
        {{ store.t.printActualSize }}
      </button>

      <!-- TXT Coordinates -->
      <button
        @click="handleCoordinatesDownload"
        class="flex items-center gap-2.5 mx-1 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
      >
        <FileCode :size="16" class="text-amber-500" />
        {{ store.t.downloadTxt }}
      </button>
    </div>
  </div>
</template>
