<script setup lang="ts">
import {
    ref,
    onMounted,
    onUnmounted,
    watch,
} from "vue"

const emits = defineEmits<{
    (event: "ready"): void
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const width = ref(0)
const height = ref(0)

function resize() {
    if (canvas.value) {
        width.value = canvas.value.clientWidth
        height.value = canvas.value.clientHeight
    }
}

onMounted(() => {
    window.addEventListener("resize", resize)
})

onUnmounted(() => {
    window.removeEventListener("resize", resize)
})

watch(canvas, canvas => {
    if (canvas) {
        resize()
        emits("ready")
    }
})

defineExpose({
    canvas,
    width,
    height,
})
</script>

<template>
    <canvas
        ref="canvas"
        :width="width"
        :height="height"
    ></canvas>
</template>

<style scoped>
canvas {
    display: block;
    width: 100%;
    height: 100%;
}
</style>