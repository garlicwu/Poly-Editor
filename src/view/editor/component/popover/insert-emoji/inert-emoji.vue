<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {emojis, getEmojis} from '@/view/editor/component/popover/insert-emoji/emoji-util'

const emit = defineEmits(['onSelectedValue'])
const categories = ref([{name: '', value: '', id: ''}])
onMounted(() => {
  categories.value = []
  if (emojis.length === 0) {
    getEmojis().then((res: any) => {
      if (res && res instanceof Array) {
        emojis.push(...res)
        categories.value = emojis.map((item) => {
          return {
            id: item.id,
            name: item.content,
            value: item.content,
          }
        })
      }
    })
  } else {
    categories.value = emojis.map((item) => {
      return {
        id: item.id,
        name: item.content,
        value: item.content,
      }
    })
  }
})

function onSelectedValue(value: string) {
  emit('onSelectedValue', value)
}
</script>

<template>
  <div class="w-fit h-min-60 grid grid-cols-6 gap-1 flex-col rounded shadow-[0_4px_10px_0px_rgba(238, 233, 229, 1)] items-center overflow-auto">
    <div v-for="category of categories" :key="category.id" class="text-insert-emoji-item-layout" @click="onSelectedValue(category.value)">
      <span class="text-lg cursor-pointer">{{ category.name }}</span>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style/tailwind.css";

.text-insert-emoji-item-layout {
  @apply w-9 h-9 text-sm text-ppt-text-dark flex items-center justify-center py-1 hover:bg-ppt-btn-bg hover:text-ppt-text-light rounded;
}
</style>
