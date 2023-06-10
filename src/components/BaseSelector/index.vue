<template>
  <div class="base-selector">
    <a-select v-model="adcode" :options="admins" style="width: 320px">
    </a-select>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { admins } from './assets/admins'

interface PropsType {
  modelValue: string | number
}
const props = defineProps<PropsType>()
const emit = defineEmits(['update:modelValue'])
const adcode = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>
<style lang="scss" scoped>
.base-selector {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 999;
  display: flex;
  grid-gap: 10px;
  color: #fff;
}
</style>
