<template>
  <div class="region-label">{{ name }}</div>
</template>
<script setup lang="ts">
interface PropsType {
  name: string
}
defineProps<PropsType>()
</script>
<style lang="scss" scoped>
.region-label {
  padding: 0 8px;
  font-size: 12px;
  color: #fff;
  background-color: #00000070;
  border-radius: 10px;
}
</style>
