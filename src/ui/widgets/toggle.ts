import {
    TWidget,
} from "./types.ts"

export type TToggleOptions = {
    label?: string,
    update?: () => void,
    get value(): boolean,
    set value(value: boolean),
}

export function createToggle(
    parentEl: HTMLElement,
    options: TToggleOptions,
): TWidget {
    const onInput = (event: Event) => {
        const toggle = event.target as HTMLInputElement
        options.value = toggle.checked
        options.update?.()
    }

    const label = document.createElement("label")
    label.classList.add("field")
    label.innerText = options.label ?? ""

    const input = document.createElement("input")
    input.type = "checkbox"
    input.checked = options.value

    input.addEventListener("input", onInput)

    parentEl.appendChild(label)
    parentEl.appendChild(input)

    return {
        discard() {
            input.removeEventListener("input", onInput)
            parentEl.removeChild(label)
            parentEl.removeChild(input)
        }
    }
}
