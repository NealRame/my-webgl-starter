import esbuildPluginTsc from "esbuild-plugin-tsc"
import vuePlugin from "esbuild-plugin-vue3"

export default function (options) {
    return {
        entryPoints: ["src/main.ts"],
        outfile: "dist/app.js",
        bundle: true,
        plugins: [
            esbuildPluginTsc({
                force: true,
                tsconfig: "tsconfig.json",
            }),
            vuePlugin(),
        ],
        ...options,
    }
}
