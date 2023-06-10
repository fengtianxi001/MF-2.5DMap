<template>
  <div ref="container" class="base-map"></div>
</template>
<script setup lang="ts">
import { onMounted, watchEffect } from 'vue'
import { useMap } from './hooks/useMap'

interface PropsType {
  adcode: string | number
}
const props = defineProps<PropsType>()
const { container, bootstrap } = useMap()
onMounted(() => {
  watchEffect(() => {
    bootstrap({
      geojson: `https://geojson.cn/api/data/${props.adcode}.json`,
    })
  })
})
</script>
<style lang="scss" scoped>
.base-map {
  width: 100vw;
  height: 100vh;
}
</style>
