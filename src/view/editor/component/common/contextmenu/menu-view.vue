<script setup lang="ts">
import {ref, computed, onMounted, reactive, onBeforeUnmount, type PropType} from 'vue'
import {computePosition, flip, shift, offset} from '@floating-ui/dom'
import {type MenuItem, type MenuOption} from './index'
import {useImage} from '@/view/editor/hooks/useImage'

const props = defineProps({
  option: {
    type: Object as PropType<MenuOption>,
    default: () => ({}),
  },
})

const {imageUrl} = useImage()
const triggerRef = ref()
const menuRef = ref()

const state = reactive({
  option: props.option,
  visible: false,
  top: 0,
  left: 0,
})

// 菜单的位置
const style = computed(() => ({
  left: state.left + 'px',
  top: state.top + 'px',
}))
// 触发器的位置
const triggerStyle = computed(() => ({
  left: state.option.clientX + 'px',
  top: state.option.clientY + 'px',
}))

// floating-ui 中间件
const middleware = [shift(), flip(), offset(10)]

const open = (option: Record<string, any>) => {
  state.option = option
  state.visible = true
  // 每次打开计算最新位置
  computePosition(triggerRef.value, menuRef.value, {middleware}).then((data) => {
    state.left = data.x
    state.top = data.y
  })
}
const close = () => {
  state.visible = false
}

// 点击菜单项
const handleItemClick = (item: MenuItem) => {
  if (state.option.onClick) {
    state.option.onClick(item)
  }
  close()
}

onMounted(() => {
  document.addEventListener('mousedown', close)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', close)
})

defineExpose({
  open,
  close,
})
</script>
<template>
  <div>
    <div ref="triggerRef" class="absolute" :style="triggerStyle"></div>
    <div ref="menuRef" v-show="state.visible" class="es-contentmenu" :style="style" @click.stop @mousedown.stop>
      <div class="contextmenu-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="12" cy="5" r="1"/>
          <circle cx="12" cy="19" r="1"/>
        </svg>
        <span class="header-title">操作菜单</span>
      </div>
      <ul v-if="state.option.items" class="contextmenu-list">
        <li v-for="item in state.option.items" :key="item.action" @click="handleItemClick(item)">
          <div class="menu-item-wrapper">
            <div class="menu-item-content">
              <span class="menu-item-label">{{ item.label }}</span>
              <div class="menu-item-notice" v-if="item.notice">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" x2="12" y1="8" y2="12"/>
                  <line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                <span class="notice-text">{{ item.notice }}</span>
              </div>
            </div>
            <div v-if="item.bottomLine" class="menu-divider"></div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
<style scoped>
@reference "@/style/tailwind.css";

.es-contentmenu {
  @apply absolute top-0 left-0 w-56 z-9999 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden;
}

.contextmenu-header {
  @apply flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100;
}

.contextmenu-header svg {
  @apply text-purple-500;
}

.header-title {
  @apply text-xs font-medium text-gray-700;
}

.contextmenu-list {
  @apply p-2;
}

.menu-item-wrapper {
  @apply w-full;
}

.menu-item-content {
  @apply flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-purple-50 hover:border-purple-200;
}

.menu-item-label {
  @apply text-sm text-gray-700 font-normal;
}

.menu-item-content:hover .menu-item-label {
  @apply text-purple-600;
}

.menu-item-notice {
  @apply flex items-center gap-1;
}

.menu-item-notice svg {
  @apply text-purple-400 w-3.5 h-3.5;
}

.notice-text {
  @apply text-[10px] text-gray-500;
}

.menu-item-content:hover .notice-text {
  @apply text-purple-500;
}

.menu-divider {
  @apply w-full h-px bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 mx-3 my-1;
}
</style>
