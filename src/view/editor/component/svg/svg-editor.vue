<script setup lang="ts">
import NoFoundSvg from '@/assets/svg/404.svg'
import {nextTick, onMounted} from 'vue'

console.log(NoFoundSvg)

onMounted(() => {
  nextTick(() => {
    // const svg = document.getElementById('svgTest')
    // const child = document.createElement('div')
    // child.innerHTML = NoFoundSvg as string
    // child.style.color = '#123999'
    // svg.appendChild(child)
  })
})
</script>

<template>
  <div class="w-full h-full flex items-center justify-center" id="svgTest">
    <!--    <img :src="NoFoundSvg" alt="" style="width: 300px;height: 300px;color: red" />-->
    <!--    <object :data="NoFoundSvg"></object>-->
    <NoFoundSvg style="fill: red" />
  </div>
</template>

<style scoped></style>
