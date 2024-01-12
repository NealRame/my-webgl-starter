<script setup lang="ts">
import {
    defineComponent,
    h,
    ref,
    watch,
} from "vue"

import {
    type TConstructor,
    type TFieldTypes,
    getModelMetadata,
} from "../decorators/model"

const { modelValue } = defineProps<{
    modelValue: Record<string, unknown>
}>()

const emit = defineEmits<{
    (event: 'update:modelValue', value: Record<string, unknown>): void
}>()

const meta = getModelMetadata(modelValue.constructor as TConstructor)
const model = ref(modelValue)

watch(model, value => emit("update:modelValue", value))

const ChoiceFieldComponent = defineComponent(function (props) {
    const { attr, choices, name } = props
    function getOptions() {
        return Array.from((choices as Map<unknown, string>).entries()).map(
            ([key, value]) => h("option", {
                value: key,
                selected: key === model.value[attr],
            }, value as string)
        )
    }
    return () => [
        h("label", {
            class: "model-inspector-label",
            innerHTML: name,
        }),
        h("select", {
            onInput: (event: Event) => {
                const target = event.target as HTMLSelectElement
                model.value = {
                    ...model.value,
                    [attr]: target.value,
                }
            },
            value: model.value[attr],
        }, getOptions()),
        h("label", {
            class: "model-inspector-value",
        })
    ]
}, {
    props: {
        attr: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        choices: {
            type: Object,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
    },
})

const RangeFieldComponent = defineComponent(function (props) {
    const { attr, name, max, min, step } = props
    return () => [
        h("label", {
            class: "model-inspector-label",
            innerHTML: name,
        }),
        h("input", {
            onInput: (event: Event) => {
                const target = event.target as HTMLInputElement
                model.value = {
                    ...model.value,
                    [attr]: Number(target.value),
                }
            },
            max,
            min,
            step,
            type: "range",
            value: model.value[attr],
        }),
        h("label", {
            class: "model-inspector-value",
            innerHTML: `${model.value[attr]}`,
        })
    ]
}, {
    props: {
        attr: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        min: {
            type: Number,
            required: true,
        },
        max: {
            type: Number,
            required: true,
        },
        step: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
    },
})

const ResetFieldComponent = defineComponent(function (props) {
    const { attr, reset, name } = props
    return () => [
        h("label", {
            class: "model-inspector-label",
            innerHTML: name,
        }),
        h("button", {
            onClick: () => {
                model.value = {
                    ...model.value,
                    [attr]: reset(),
                }
            },
        }, "Reset"),
    ]
}, {
    props: {
        attr: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        reset: {
            type: Function,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
    },
})

const ToggleFieldComponent = defineComponent(function (props) {
    const { attr, name } = props
    return () => [
        h("label", {
            class: "model-inspector-label",
            innerHTML: name,
        }),
        h("input", {
            onInput: (event: Event) => {
                const target = event.target as HTMLInputElement
                model.value = {
                    ...model.value,
                    [attr]: Number(target.value),
                }
            },
            type: "checkbox",
            value: model.value[attr],
        }),
        h("label", {
            class: "model-inspector-value",
        })
    ]
}, {
    props: {
        attr: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
    },
})

const components: {
    [K in TFieldTypes]: Function
} = {
    "choice": ChoiceFieldComponent,
    "range": RangeFieldComponent,
    "reset": ResetFieldComponent,
    "toggle": ToggleFieldComponent,
}
</script>

<template>
    <div class="model-inspector">
        <component
            v-for="(field, key) in meta"
            v-bind="field"
            :is="components[field.type]"
            :attr="key"
            :key="key"
        />
    </div>
</template>

<style>
.model-inspector {
    display: grid;
    grid-template-columns: auto 1fr 6ch;
    column-gap: .5rem;
    row-gap: .25rem;
}

.model-inspector button,
.model-inspector select {
    grid-column-end: span 1;
    width: 100%;
}

.model-inspector-label {
    font-family: sans-serif;
    font-weight: bold;
    text-align: right;
    text-transform: capitalize;
}
.model-inspector-label::after {
    content: ":";
}

.model-inspector-value {
    font-family: monospace;
    text-align: left;
}
</style>
