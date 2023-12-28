import {
    TWidget,
} from "./types"

export type TSelectOptions = {
    label?: string,
    values: Array<string | [string, string]>,
    get value(): string,
    set value(value: string),
}

export function createSelect(
    parentEl: HTMLElement,
    options: TSelectOptions,
): TWidget {
    const label = document.createElement("label")
    label.classList.add("field")
    label.innerText = options.label ?? ""

    const select = document.createElement("select")

    for (const value of options.values) {
        const [key, label] = typeof value === "string"
            ? [value, value]
            : value

        const optionEl = document.createElement("option")
        optionEl.value = key
        optionEl.innerText = label

        select.appendChild(optionEl)
    }

    const onChange = (event: Event) => {
        const select = event.target as HTMLSelectElement
        const value = select.value
        options.value = value
    }

    select.value = options.value
    select.addEventListener("change", onChange)

    parentEl.appendChild(label)
    parentEl.appendChild(select)

    return {
        discard() {
            select.removeEventListener("change", onChange)
            parentEl.removeChild(label)
            parentEl.removeChild(select)
        },
    }
}