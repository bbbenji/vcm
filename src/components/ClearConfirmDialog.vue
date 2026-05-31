<script setup lang="ts">
import { ref } from "vue";
import { useMatStore } from "../stores/matStore";

const store = useMatStore();
const dialogRef = ref<HTMLDialogElement | null>(null);

const emit = defineEmits(["confirm"]);

const showModal = () => {
  dialogRef.value?.showModal();
};

const close = () => {
  dialogRef.value?.close();
};

const confirm = () => {
  emit("confirm");
  close();
};

defineExpose({
  showModal,
  close,
});
</script>

<template>
  <!-- Custom Native Dialog Modal for Clear Grid Confirmation -->
  <dialog
    ref="dialogRef"
    class="fixed inset-0 m-auto glass-modal p-6 rounded-2xl max-w-sm w-[calc(100vw-2rem)] text-slate-800 dark:text-slate-100 backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm outline-none border border-slate-150 dark:border-slate-800/80 shadow-2xl bg-white dark:bg-slate-900 animate-fade-in"
  >
    <h3 class="text-lg font-bold font-heading mb-2 text-slate-800 dark:text-slate-100">
      {{ store.t.clear }}
    </h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
      {{ store.t.clearConfirm }}
    </p>
    <div class="flex justify-end gap-3 font-semibold">
      <button
        @click="close"
        class="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-all active:scale-95"
      >
        {{ store.t.cancel }}
      </button>
      <button
        @click="confirm"
        class="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg cursor-pointer transition-all active:scale-95 shadow-sm shadow-rose-500/10"
      >
        {{ store.t.clear }}
      </button>
    </div>
  </dialog>
</template>
