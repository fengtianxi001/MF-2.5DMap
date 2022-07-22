<template>
  <div class="area-label">
    <div class="area-label__name">{{ name }}</div>
  </div>
</template>
<script setup lang="ts">
import { ref, defineProps } from 'vue';
const props = defineProps({
  adcode: [String, Number],
  name: String,
});
const count = ref(0);
</script>
<style lang="scss" scoped>
.area-label {
  .area-label__name {
    font-size: 12px;
    color: #fff;
    background: #000;
    padding: 0 5px;
    border-radius: 5px;
    line-height: 20px;
    margin-top: -5px;
    cursor: pointer;
  }
}
</style>
