export interface JsonUnit {
    id: bigint,
    name: string,
    abbreviation: string,
    base: JsonUnit | null,
    baseFactor: number
}
export interface Ingredient {
    name: string
    id: bigint | null
    defaultUnit: JsonUnit
}

export interface IngredientQuantity {
    id: bigint | null
    quantity: number
    ingredient: Ingredient
    unit: JsonUnit
}
export interface Recipe {
    id: bigint | null
    name: string
    method: string
    servings: number
    ingredientQuantities: IngredientQuantity[]
    sourceUrl?: string
}

export interface ImportedIngredientLine {
    rawText: string
    quantity: number | null
    ingredientNameHint: string | null
    unitNameHint: string | null
    resolvedIngredient: Ingredient | null
    resolvedUnit: JsonUnit | null
}

export interface RecipeImportDraft {
    name: string
    servings: number | null
    method: string
    sourceUrl: string
    extractionSource: 'SCHEMA_ORG' | 'LLM'
    ingredientLines: ImportedIngredientLine[]
}

export interface IngredientAlias {
    id: bigint
    aliasText: string
    ingredientId: bigint
    unitId: bigint
}

export interface PageResponse<T> {
    content: T[]
    page: number
    size: number
    totalElements: number
    totalPages: number
}