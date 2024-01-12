import * as esbuild from "esbuild"
import * as portscanner from "portscanner"

import createBuildSettings from "./settings.js"

const PORT_FIRST = 5173
const PORT_LAST = PORT_FIRST + 10

const settings = createBuildSettings({
    banner: {
        js: `new EventSource('/esbuild').addEventListener('change', () => location.reload());`,
    },
    logLevel: "info",
    sourcemap: true,
})
const ctx = await esbuild.context(settings)

const host = "localhost"
const port = await portscanner.findAPortNotInUse(PORT_FIRST, PORT_LAST, host)

await ctx.watch()
await ctx.serve({
    port,
    host,
    servedir: "dist",
    fallback: "index.html",
})
