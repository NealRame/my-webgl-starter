import {
    makeNoise2D,
} from "open-simplex-noise"

import {
    clamp,
} from "../numerics"

import {
    type TNoise2DGenerator,
} from "./types"

export enum ENoiseFunction {
    None = "none",
    Billowy = "billowy",
    Ridged = "ridged",
}

function billowy(
    fn: TNoise2DGenerator,
): TNoise2DGenerator {
    return (x, y) => 2*Math.abs(fn(x, y)) - 1
}

function ridged(
    fn: TNoise2DGenerator,
): TNoise2DGenerator {
    return (x, y) => 2*(1 - Math.abs(fn(x, y))) - 1
}

function createNoise(
    seed: number,
    type: ENoiseFunction,
): TNoise2DGenerator {
    const noise = makeNoise2D(seed)
    switch (type) {
        case ENoiseFunction.None:
            return noise
        case ENoiseFunction.Billowy:
            return billowy(noise)
        case ENoiseFunction.Ridged:
            return ridged(noise)
    }
    const exhaustiveCheck: never = type
    throw new Error(exhaustiveCheck)
}


export type TFractionalBrownianMotionOptions = {
    // Initial amplitude of the noise.
    // Default to 1.0
    amplitude?: number

    // Gain is the factor that the amplitude of each octave is multiplied by.
    // Default to 1.0
    gain?: number

    // Octave count i.e. the number of levels of detail.
    // Value will be clamped to the range [1, Infinity[.
    // Default to 1.0
    octaves?: number

    // Initial frequency of the noise.
    // Default to 1.0
    frequency?: number

    // Frequency multiplier between successive octaves.
    // Default to 2.0
    lacunarity?: number

    // Scale of the noise.
    // Value will be clamped to the range [Number.MIN_VALUE, Infinity[.
    // Default to 1.0
    scale?: number

    // Seed of the noise.
    // Default to Date.now().
    seed?: number

    // Noise function.
    // Default to none.
    type?: ENoiseFunction
}

export const FBMConfigDefaults: Required<TFractionalBrownianMotionOptions> = {
    amplitude: 1.0,
    gain: 1.0,
    octaves: 1.0,
    frequency: 1.0,
    lacunarity: 2.0,
    scale: 1.0,
    seed: Date.now(),
    type: ENoiseFunction.None,
}

/**
 * Create a 2D noise generator.
 * @param config generator configuration
 * @returns a 2D noise generator
 */
export function createFractionalBrownianMotion(
    config: TFractionalBrownianMotionOptions = {},
): TNoise2DGenerator {
    const gain = config.gain ?? FBMConfigDefaults.gain
    const octaves = clamp(Math.floor(config.octaves ?? FBMConfigDefaults.octaves), 1, Infinity)
    const lacunarity = config.lacunarity ?? FBMConfigDefaults.lacunarity
    const scale = clamp(config.scale ?? FBMConfigDefaults.scale, Number.MIN_VALUE, Infinity)
    const seed = config.seed ?? FBMConfigDefaults.seed

    const noise = createNoise(seed, config.type ?? FBMConfigDefaults.type)

    return (x, y): number => {
        let amplitude = config.amplitude ?? FBMConfigDefaults.amplitude
        let frequency = config.frequency ?? FBMConfigDefaults.frequency
        let sum = 0.0

        for (let i = 0; i < octaves; i++) {
            sum += amplitude*noise(x*frequency/scale, y*frequency/scale)
            amplitude *= gain
            frequency *= lacunarity
        }
        return sum
    }
}
