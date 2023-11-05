export type IAppletConfig = {
    canvas: HTMLCanvasElement,
    appletSettings: HTMLFormElement,
}

export interface IApplet {
    readonly name: string
    animate?: boolean
    render(): IApplet
    cleanup(): IApplet
    setup(config: IAppletConfig): IApplet
}
