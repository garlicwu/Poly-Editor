<template>
  <div v-show="show" class="absolute left-0 top-0 w-24 h-24 border flex items-center justify-center border-dashed border-sky-700 bg-sky-100 opacity-75" :style="areaStyle">
    <span v-show="showText" class="text-zinc-900 text-2xl font-bold">这里是标题</span>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import {useEditorStore} from '@/store/editorStore'
import {storeToRefs} from 'pinia'

const store = useEditorStore()
const {post} = storeToRefs(store)
const emit = defineEmits(['move', 'up'])
const show = ref(false)
const showText = ref(false)
const areaData = ref({
  width: 0,
  height: 0,
  top: 0,
  left: 0,
})
const areaStyle = computed(() => {
  const {width, height, top, left} = areaData.value
  return {
    width: width + 'px',
    height: height + 'px',
    top: top + 'px',
    left: left + 'px',
  }
})

function onMouseDown(e: MouseEvent) {
  // 鼠标按下的位置
  const {pageX: downX, pageY: downY} = e
  console.log('onMouseDown', downX, downY)
  const elRect = (e.target as HTMLElement)!.getBoundingClientRect()

  // 鼠标在编辑器中的偏移量
  const offsetX = downX - elRect.left
  const offsetY = downY - elRect.top
  const onMouseMove = (e: MouseEvent) => {
    // 移动的距离
    const disX = e.pageX - downX
    const disY = e.pageY - downY
    // 得到默认的left、top
    let left = offsetX,
      top = offsetY
    // 宽高取鼠标移动距离的绝对值
    let width = Math.abs(disX),
      height = Math.abs(disY)
    // 避免点击显示
    if (width > 20 || height > 20) {
      show.value = true
    }

    // 如果往左，将left减去增加的宽度
    if (disX < 0) {
      left = offsetX - width
    }

    // 如果往上，将top减去增加的高度
    if (disY < 0) {
      top = offsetY - height
    }
    dealWidthHeight(width, height, left, top)
    emit('move', {...areaData.value})
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    show.value = false
    emit('up', areaData.value)
    dealWidthHeight(0, 0, 0, 0)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function dealWidthHeight(width: number, height: number, left: number, top: number) {
  const scale = post.value.scale ?? 1
  areaData.value = {
    width: width / scale,
    height: height / scale,
    left: left / scale,
    top: top / scale,
  }
}

defineExpose({
  onMouseDown,
  areaData,
})
</script>

<style scoped></style>
