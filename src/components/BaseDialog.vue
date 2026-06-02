<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import { getPlacedIcon } from "../utils/icons";
import confetti from "canvas-confetti";

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: "rose" | "emerald" | "primary";
    iconType?: "clear" | "win" | "lose";
    hideConfirm?: boolean;
    size?: "sm" | "md" | "lg";
  }>(),
  {
    confirmVariant: "primary",
    size: "sm",
  },
);

const emit = defineEmits(["confirm", "cancel", "close"]);
const dialogRef = ref<HTMLDialogElement | null>(null);
const confettiCanvasRef = ref<HTMLCanvasElement | null>(null);
let localConfetti: ReturnType<typeof confetti.create> | null = null;

const triggerConfetti = () => {
  nextTick(() => {
    if (confettiCanvasRef.value) {
      localConfetti = confetti.create(confettiCanvasRef.value, {
        resize: true,
        useWorker: true,
      });

      if (localConfetti) {
        // Primary center blast
        localConfetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        // Staggered side cannons for a spectacular victory celebration!
        const end = Date.now() + 2 * 1000; // 2 seconds duration
        const frame = () => {
          if (!props.isOpen || !localConfetti) return;
          localConfetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
          });
          localConfetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }
    }
  });
};

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      if (!dialogRef.value?.open) {
        dialogRef.value?.showModal();
      }
      if (props.iconType === "win") {
        triggerConfetti();
      }
    } else {
      if (dialogRef.value?.open) {
        dialogRef.value?.close();
      }
      localConfetti = null;
    }
  },
);

const handleCancel = () => {
  emit("cancel");
  emit("close");
};

const handleConfirm = () => {
  emit("confirm");
  emit("close");
};

// Handle native ESC key closure
const handleCloseEvent = () => {
  if (props.isOpen) {
    emit("close");
  }
};

onMounted(() => {
  if (props.isOpen && !dialogRef.value?.open) {
    dialogRef.value?.showModal();
    if (props.iconType === "win") {
      triggerConfetti();
    }
  }
});
</script>

<template>
  <dialog
    ref="dialogRef"
    @close="handleCloseEvent"
    @mousedown.self="handleCancel"
    class="fixed inset-0 w-screen h-screen bg-transparent border-none outline-none p-0 max-w-none shadow-none backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm overflow-hidden"
  >
    <!-- Canvas for top-layer confetti (spans full viewport) -->
    <canvas
      v-if="isOpen && iconType === 'win'"
      ref="confettiCanvasRef"
      class="absolute inset-0 w-full h-full pointer-events-none z-50 animate-fade-in"
    ></canvas>

    <!-- Centered dialog card container -->
    <div class="flex items-center justify-center w-full h-full p-4 pointer-events-none">
      <div
        class="glass-modal p-6 rounded-2xl w-full text-slate-800 dark:text-slate-100 border border-slate-150 dark:border-slate-800/80 shadow-2xl bg-white dark:bg-slate-900 animate-fade-in pointer-events-auto relative z-10"
        :class="{
          'max-w-sm': size === 'sm',
          'max-w-md': size === 'md',
          'max-w-lg': size === 'lg'
        }"
      >
        <div class="flex flex-col items-center text-center select-none">
          <!-- Icon Header -->
          <div
            v-if="iconType"
            class="h-14 w-14 rounded-full flex items-center justify-center mb-4 shadow-md border"
            :class="{
              'bg-rose-50 dark:bg-rose-950/30 text-rose-500 border-rose-100 dark:border-rose-900/40':
                iconType === 'clear',
              'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border-emerald-100 dark:border-emerald-900/40':
                iconType === 'win',
              'bg-rose-50 dark:bg-rose-950/30 text-rose-500 border-rose-100 dark:border-rose-900/40 animate-bounce':
                iconType === 'lose',
            }"
          >
            <component
              :is="iconType === 'win' ? getPlacedIcon('EvCharger') : getPlacedIcon('Bot')"
              class="w-7 h-7"
              :class="{
                'text-rose-500 dark:text-rose-400': iconType === 'clear' || iconType === 'lose',
                'text-amber-500 dark:text-amber-400': iconType === 'win',
              }"
            />
          </div>

          <h3
            v-if="title"
            class="text-xl font-bold font-heading mb-2 text-slate-800 dark:text-slate-100"
          >
            {{ title }}
          </h3>

          <p
            v-if="description"
            class="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed"
          >
            {{ description }}
          </p>
          
          <slot></slot>

          <div class="flex w-full gap-3 font-semibold justify-end">
            <!-- Cancel button (only if cancelText is provided) -->
            <button
              v-if="cancelText"
              @click="handleCancel"
              class="flex-1 px-4 py-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-all active:scale-95 text-center"
            >
              {{ cancelText }}
            </button>

            <!-- Confirm button -->
            <button
              v-if="!hideConfirm"
              @click="handleConfirm"
              class="flex-1 px-4 py-2.5 text-xs font-bold text-white rounded-lg cursor-pointer transition-all active:scale-95 text-center shadow-md shadow-primary/10"
              :class="{
                'bg-rose-500 hover:bg-rose-600': confirmVariant === 'rose',
                'bg-emerald-500 hover:bg-emerald-600': confirmVariant === 'emerald',
                'bg-primary hover:bg-primary-hover': confirmVariant === 'primary',
              }"
            >
              {{ confirmText || "OK" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </dialog>
</template>
