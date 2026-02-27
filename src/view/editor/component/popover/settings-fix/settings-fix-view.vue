<script setup lang="ts">

import {ref} from "vue";

const categories = ref([
  {name: "一级标题锁定", key: "一级标题锁定"},
  {name: "一级标题锁定", key: "一级标题锁定"},
  {name: "正文锁定", key: "正文锁定"}
]);
const selectedCategories = ref(['Marketing']);
</script>

<template>
  <div class="w-42 flex flex-col rounded shadow-[0_4px_10px_0px_rgba(238, 233, 229, 1)] items-center">
    <div class="flex flex-col gap-4">
      <div v-for="category of categories" :key="category.key" class="flex items-center gap-2">
        <Checkbox
            v-model="selectedCategories" :input-id="category.key" name="category" :value="category.name"
            class="my-custom-checkbox-style"/>
        <label :for="category.key" class="text-ppt-text-dark text-sm">{{ category.name }}</label>
      </div>
    </div>

  </div>

</template>

<style scoped>
.my-custom-checkbox-style.p-checkbox-checked .p-checkbox-box {
  background: var(--color-ppt-text-orange);
}

.my-custom-radio-style .p-checkbox-box {
  border: 1px solid #F0F0F0;
}
</style>
