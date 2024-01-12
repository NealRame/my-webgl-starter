// Symbol.metadata polyfill
Object.assign(Symbol, {
    metadata: Symbol("Symbol.metadata")
})

export type TConstructor<T = any> = new(...args: Array<any>) => T

export type TChoiceFieldOptions<T> = {
    name?: string
    choices: Map<T, string>
}
export type TChoiceFieldConfig<T> = Required<TChoiceFieldOptions<T>> & {
    type: "choice"
}

export type TRangeFieldOptions = {
    name?: string
    min?: number
    max?: number
    step?: number
}
export type TRangeFieldConfig = Required<TRangeFieldOptions> & {
    type: "range"
}

export type TResetFieldOptions<T> = {
    name?: string
    reset: () => T
}
export type TResetFieldConfig<T> = Required<TResetFieldOptions<T>> & {
    type: "reset"
}

export type TToggleFieldOptions = {
    name?: string
}
export type TToggleFieldConfig = Required<TToggleFieldOptions> & {
    type: "toggle"
}

export type TFieldDecoratorConfig<T> =
    T extends number
        ? TRangeFieldConfig
        : T extends boolean
            ? TToggleFieldConfig
            : TChoiceFieldConfig<T> | TResetFieldConfig<T>

export type TModelMetadata = Record<string, TFieldDecoratorConfig<any>>

export type TFieldTypes = TFieldDecoratorConfig<any>["type"]

const ModelMetadataKey = Symbol("Model")

const RangeDefaults: Omit<Omit<TRangeFieldConfig, "type">, "name"> = {
    min: 0,
    max: 1,
    step: 0.01,
}

function ensureMetadata(metadata: DecoratorMetadata) {
    if (!(ModelMetadataKey in metadata)) {
        metadata[ModelMetadataKey] = {}
    }
    return metadata[ModelMetadataKey] as TModelMetadata
}

export function choice<This, Value>(options: TChoiceFieldOptions<Value>) {
    return function (
        _: undefined,
        { name, metadata }: ClassFieldDecoratorContext<This, Value>
    ) {
        const modelMetadata = ensureMetadata(metadata)
        Object.assign(modelMetadata, {
            [name]: {
                type: "choice",
                name,
                ...options,
            }
        })
    }
}

export function range<This>(options: TRangeFieldOptions = {}) {
    return function (
        _: undefined,
        { name, metadata }: ClassFieldDecoratorContext<This, number>,
    ) {
        const modelMetadata = ensureMetadata(metadata)
        Object.assign(modelMetadata, {
            [name]: {
                type: "range",
                name,
                ...RangeDefaults,
                ...options,
            }
        })
    }
}

export function refresh<This, Value>(options: TResetFieldOptions<Value>) {
    return function (
        _: undefined,
        { name, metadata }: ClassFieldDecoratorContext<This, Value>,
    ) {
        const modelMetadata = ensureMetadata(metadata)
        Object.assign(modelMetadata, {
            [name]: {
                type: "refresh",
                name,
                ...options,
            }
        })
    }
}

export function toggle<This>(options: TToggleFieldOptions = {}) {
    return function (
        _: undefined,
        { name, metadata }: ClassFieldDecoratorContext<This, boolean>,
    ) {
        const modelMetadata = ensureMetadata(metadata)
        Object.assign(modelMetadata, {
            [name]: {
                type: "toggle",
                name,
                ...options,
            }
        })
    }
}

export function getModelMetadata(
    target: TConstructor | null | undefined,
): TModelMetadata {
    return (target?.[Symbol.metadata]?.[ModelMetadataKey] ?? {}) as TModelMetadata
}
