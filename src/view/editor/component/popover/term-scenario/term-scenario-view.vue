<script setup lang="ts">

import {ref} from "vue";

const termScenarioList = ref<string[]>([])
const selectedScenario = ref<string>()
</script>

<template>
  <div class="w-45 flex flex-col rounded shadow-[0_4px_10px_0px_rgba(238, 233, 229, 1)] items-center">
    <ul class="w-full pb-3">
      <li
          v-for="(termScenario,index) in termScenarioList" :key="termScenario + index" class="scenario-item-layout"
          :class="selectedScenario===termScenario?'selected':''">
        {{ termScenario }}
      </li>
    </ul>

    <div class="w-16 h-8 mt-auto rounded bg-ppt-text-orange text-center text-white text-sm">
      确定
    </div>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.scenario-item-layout {
  @apply w-full h-9 text-sm text-ppt-text-dark;

  &.selected {
    @apply bg-ppt-bg-orange text-ppt-text-orange;
  }
}
</style>
