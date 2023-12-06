import {
    TWidget,
} from "./types.ts"

export type TButtonOptions = {
    label?: string,
    update: () => void,
}

export function createButton(
    parentEl: HTMLElement,
    options: TButtonOptions,
): TWidget {
    const button = parentEl.appendChild(document.createElement("button"))

    const onClick = (ev: Event) => {
        ev.preventDefault()
        ev.stopPropagation()
        options.update()
    }

    button.innerText = options.label ?? ""
    button.addEventListener("click", onClick)

    return {
        discard() {
            button.removeEventListener("click", onClick)
            parentEl.removeChild(button)
        }
    }
}
