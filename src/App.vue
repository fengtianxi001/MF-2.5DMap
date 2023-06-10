<template>
  <div class="container">
    <BaseSelector v-model="adcode" />
    <BaseMap :adcode="adcode" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import BaseMap from './components/BaseMap/index.vue'
import BaseSelector from './components/BaseSelector/index.vue'

const adcode = ref(340000)
</script>
<style lang="scss" scoped>
.container {
  width: 100vw;
  height: 100vh;
}
</style>
