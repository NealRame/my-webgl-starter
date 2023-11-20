import {
    TWidget,
} from "./types"

export type TNumberInputOptions = {
    min?: number,
    max?: number,
    step?: number,
    label?: string,
    unit?: string,
    update?: () => void,
    get value(): number,
    set value(value: number),
}

export function createNumberInput(
    parentEl: HTMLElement,
    options: TNumberInputOptions,
): TWidget {
    const onInput = (event: Event) => {
        const input = event.target as HTMLInputElement
        options.value = Number(input.value)
        options.update?.()
    }

    const label = document.createElement("label")
    label.classList.add("field")
    label.innerText = options.label ?? ""

    const input = document.createElement("input")
    input.type = "range"
    input.min = String(options.min ?? 0)
    input.max = String(options.max ?? 100)
    input.step = String(options.step ?? 1)
    input.value = String(options.value)

    input.addEventListener("input", onInput)

    const unit = document.createElement("label")
    unit.classList.add("unit")
    unit.innerText = options.unit ?? ""

    parentEl.appendChild(label)
    parentEl.appendChild(input)
    parentEl.appendChild(unit)

    return {
        discard() {
            input.removeEventListener("input", onInput)
            parentEl.removeChild(label)
            parentEl.removeChild(input)
            parentEl.removeChild(unit)
        }
    }
}
