import "./style.css"

import * as UI from "./ui"

import defaultApplet, {
    Applets,
    type IApplet,
} from "./applets"

try {
    const canvas = document.querySelector("#screen") as HTMLCanvasElement
    if (canvas == null) {
        throw new Error("Failed to find canvas.")
    }

    const appletSelector = document.querySelector("#applet-selector-select") as HTMLSelectElement
    const appletToggleAnimation = document.querySelector("#applet-toggle-animation") as HTMLInputElement
    const appletSettings = document.querySelector("#applet-settings") as HTMLFormElement

    Object.keys(Applets).forEach(key => {
        const option = document.createElement("option")
        option.value = key
        option.innerText = Applets[key as keyof typeof Applets].name
        appletSelector.appendChild(option)
    })

    let currentApplet: IApplet | null = null

    const startApplet = (applet: IApplet) => {
        if (currentApplet) {
            currentApplet.cleanup()
        }
        currentApplet = applet
        currentApplet
            .setup({
                canvas,
                appletSettings,
            })
            .render()
    }

    appletSelector.addEventListener("change", () => {
        startApplet(Applets[appletSelector.value as keyof typeof Applets])
    })
    appletToggleAnimation.addEventListener("change", () => {
        if (currentApplet) {
            currentApplet.animate = appletToggleAnimation.checked
        }
    })

    window.addEventListener("resize", () => {
        UI.resizeCanvasToDisplaySize(canvas)
        if (currentApplet) {
            currentApplet.render()
        }
    })

    UI.resizeCanvasToDisplaySize(canvas)

    appletSelector.value = defaultApplet
    appletSelector.dispatchEvent(new Event("change"))
} catch (error) {
    if (error instanceof Error) {
        alert(error.message)
        console.error(error)
    } else {
        alert("An unknown error occurred.")
    }
}


