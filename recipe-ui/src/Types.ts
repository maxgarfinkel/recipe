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
    unit: JsonUnit
}

export interface IngredientQuantity {
    id: bigint | null
    quantity: number
    ingredient: Ingredient
}
export interface Recipe {
    id: bigint | null
    name: string
    method: string
    servings: number
    ingredientQuantities: IngredientQuantity[]
}