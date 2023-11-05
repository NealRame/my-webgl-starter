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

export type TSelectOptions = {
    label?: string,
    values: Array<string | [string, string]>,
    update?: () => void,
    get value(): string,
    set value(value: string),
}

export type TToggleOptions = {
    label?: string,
    update?: () => void,
    get value(): boolean,
    set value(value: boolean),
}

export function createHeader(
    parentEl: HTMLElement,
    title: string,
) {
    const header = parentEl.appendChild(document.createElement("h1"))
    header.innerText = title
}

export function createNumberInput(
    parentEl: HTMLElement,
    options: TNumberInputOptions,
) {
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

    return () => {
        input.removeEventListener("input", onInput)
        parentEl.removeChild(label)
        parentEl.removeChild(input)
        parentEl.removeChild(unit)
    }
}

export function createSelect(
    parentEl: HTMLElement,
    options: TSelectOptions,
) {
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

    return () => {
        select.removeEventListener("change", onChange)
        parentEl.removeChild(label)
        parentEl.removeChild(select)
    }
}

export function createToggle(
    parentEl: HTMLElement,
    options: TToggleOptions,
) {
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

    return () => {
        input.removeEventListener("input", onInput)
        parentEl.removeChild(label)
        parentEl.removeChild(input)
    }
}

export function resizeCanvasToDisplaySize(
    canvas: HTMLCanvasElement,
) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth
    const displayHeight = canvas.clientHeight

    // Check if the canvas is not the same size.
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width  = displayWidth
        canvas.height = displayHeight
    }
}
