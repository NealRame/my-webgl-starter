import {
    makeNoise2D,
} from "open-simplex-noise"

export type TNoise2DGenerator = (x: number, y: number) => number

export type TNoise2DGeneratorOptions = {
    amplitude?: number,
    frequency?: number,
    octaves?: number,
    persistence?: number,
    scale?: number,
    seed?: number,
}

const noise2DGeneratorConfigDefaults = {
    amplitude: 1,
    frequency: 1,
    octaves: 1,
    persistence: 0.5,
    scale: 1,
}

/**
 * Create a 2D noise generator.
 * @param config generator configuration
 * @returns a 2D noise generator
 */
export function createNoise2DGenerator(
    config: TNoise2DGeneratorOptions = {},
): TNoise2DGenerator {
    const noise = makeNoise2D(config.seed ?? Date.now())
    const {
        scale,
        amplitude,
        frequency,
        octaves,
        persistence,
    } = Object.assign({}, noise2DGeneratorConfigDefaults, config)
    return (x, y ): number => {
        let value = 0
        x /= scale
        y /= scale
        for (let octave = 0; octave < octaves; octave++) {
            const f = frequency*Math.pow(2, octave)
            value += amplitude*Math.pow(persistence, octave)*noise(x*f, y*f)
        }
        return value/(2 - 1/Math.pow(2, octaves - 1))
    }
}