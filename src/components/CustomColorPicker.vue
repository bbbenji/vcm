<script setup lang="ts">
import { ref, defineAsyncComponent } from "vue";
import { getIcon } from "../utils/icons";

const BaseDialog = defineAsyncComponent(() => import("./BaseDialog.vue"));

defineProps<{
  modelValue: string;
  selectedToolClass: string;
  isActive: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
  (e: "input", value: string): void;
}>();

const isDialogOpen = ref(false);

const openDialog = () => {
  isDialogOpen.value = true;
};

const closeDialog = () => {
  isDialogOpen.value = false;
};

const selectColor = (color: string) => {
  emit("update:modelValue", color);
  emit("input", color);
  emit("change", color);
  closeDialog();
};

const honeycombColors = [
  ["#006699", "#003399", "#003366", "#000099", "#000066", "#0000cc", "#660066"],
  ["#006666", "#0066cc", "#0066ff", "#0033cc", "#0000ff", "#6600cc", "#6600ff", "#660033"],
  [
    "#009999",
    "#0099cc",
    "#0099ff",
    "#3366ff",
    "#3333ff",
    "#3333cc",
    "#9900ff",
    "#9900cc",
    "#990099",
  ],
  [
    "#009933",
    "#00cc99",
    "#00ccff",
    "#33ccff",
    "#3399ff",
    "#3366cc",
    "#9933ff",
    "#cc00ff",
    "#cc00cc",
    "#990033",
  ],
  [
    "#009900",
    "#00cc66",
    "#00ffcc",
    "#66ffff",
    "#99ccff",
    "#9999ff",
    "#9966ff",
    "#cc33ff",
    "#ff00ff",
    "#cc0099",
    "#800000",
  ],
  [
    "#006600",
    "#33cc33",
    "#00ff99",
    "#66ffcc",
    "#99ffcc",
    "#ccffff",
    "#ccccff",
    "#ff99ff",
    "#ff33cc",
    "#ff0066",
    "#cc0066",
    "#990000",
  ],
  [
    "#339933",
    "#00cc00",
    "#00ff00",
    "#66ff99",
    "#99ff99",
    "#ccffcc",
    "#ffffff",
    "#ffccff",
    "#ff99cc",
    "#ff3399",
    "#cc3399",
    "#cc0000",
    "#993366",
  ],
  [
    "#336600",
    "#339966",
    "#66ff33",
    "#66ff66",
    "#99ff66",
    "#ffffcc",
    "#ffcccc",
    "#ff9999",
    "#ff5050",
    "#ff0000",
    "#993333",
    "#993300",
  ],
  [
    "#669900",
    "#33cccc",
    "#99ff33",
    "#ccff33",
    "#ccff99",
    "#ffff99",
    "#ff9966",
    "#ff3300",
    "#cc3300",
    "#993399",
    "#663300",
  ],
  [
    "#666633",
    "#99cc00",
    "#ccff66",
    "#ffff66",
    "#ffff00",
    "#ffcc66",
    "#ff9933",
    "#ff6600",
    "#cc6600",
    "#333300",
  ],
  [
    "#336699",
    "#999966",
    "#cccc00",
    "#ffcc00",
    "#ff9900",
    "#cc9900",
    "#ff6666",
    "#996600",
    "#333399",
  ],
  ["#996633", "#669999", "#ffcc99", "#cc6699", "#ff6699", "#666699", "#ff66cc", "#003300"],
  ["#6699ff", "#6666ff", "#cc99ff", "#cc66ff", "#ff66ff", "#66ccff", "#00ffff"],
];
</script>

<template>
  <button
    @click="openDialog"
    class="group relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-all hover:scale-105 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1 dark:border-white/10 dark:bg-gray-900 dark:focus-within:ring-offset-gray-900"
    style="background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
    :class="{
      [selectedToolClass]: isActive,
    }"
    :title="title"
  >
    <div
      class="absolute inset-0 bg-white/30 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-0 dark:bg-black/30 pointer-events-none"
    ></div>

    <component
      :is="getIcon('Palette')"
      class="relative z-10 h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-transform duration-200 group-hover:scale-110 group-active:scale-95 pointer-events-none"
    />
  </button>

  <BaseDialog
    :isOpen="isDialogOpen"
    :title="title || 'Wybierz kolor'"
    cancelText="Anuluj"
    :hide-confirm="true"
    size="lg"
    @cancel="closeDialog"
    @close="closeDialog"
  >
    <div class="flex flex-col items-center justify-center py-4 w-full">
      <div v-for="(row, rowIndex) in honeycombColors" :key="rowIndex" class="honeycomb-row w-full">
        <button
          v-for="color in row"
          :key="color"
          @click="selectColor(color)"
          class="hex-cell cursor-pointer transition-transform hover:scale-125 focus-visible:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 relative z-10 hover:z-20 shadow-sm border border-black/10 dark:border-white/10"
          :style="{
            backgroundColor: color,
          }"
          :title="color"
        >
          <!-- Active indicator -->
          <div
            v-if="modelValue.toLowerCase() === color.toLowerCase()"
            class="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div class="w-[40%] aspect-square bg-black/40 rounded-full blur-[1px]"></div>
            <div class="absolute w-[25%] aspect-square bg-white rounded-full shadow-sm"></div>
          </div>
        </button>
      </div>
    </div>
  </BaseDialog>
</template>

<style scoped>
.honeycomb-row {
  display: flex;
  justify-content: center;
  margin-top: -1.96%;
}
.honeycomb-row:first-child {
  margin-top: 0;
}
.hex-cell {
  width: 7.4%;
  aspect-ratio: 1 / 1.1547;
  margin: 0 0.1%;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}
</style>
