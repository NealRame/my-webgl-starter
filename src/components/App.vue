<script setup lang="ts">
import {
    onMounted,
    ref,
    watch,
} from "vue"

import MyScreen from "./Screen.vue"
import ModelInspector from "./ModelInspector.vue"

import {
    Applets,
} from "../applets"

const animate = ref(false)
const screen = ref<typeof MyScreen | null>(null)
const applets = ref(new Applets())

watch(applets, value => {
    console.log(value)
})
onMounted(() => {
    console.log(screen.value?.canvas)
})
</script>

<template>
    <div id="inspector">
        <section id="applet-selector">
            <ModelInspector v-model="applets"/>

            <label for="applet-selector-select">Applet</label>
            <select id="applet-selector-select"></select>

            <label for="applet-toggle-animation">Animate</label>
            <input
                id="applet-toggle-animation"
                type="checkbox"
                v-model="animate"
            >
        </section>
        <form id="applet-settings"></form>
    </div>
    <MyScreen ref="screen"/>
</template>