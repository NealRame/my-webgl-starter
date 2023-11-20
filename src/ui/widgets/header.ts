import type {
    TWidget,
} from "./types"

export function createHeader(
    parentEl: HTMLElement,
    title: string,
): TWidget {
    const header = parentEl.appendChild(document.createElement("h1"))
    header.innerText = title
    return {
        discard() {}
    }
}
