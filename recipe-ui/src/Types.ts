export interface Unit {
    id: bigint,
    name: string,
    abbreviation: string,
    base: Unit | null,
    baseFactor: number
}
export interface Ingredient {
    name: string
    id: bigint | null
    unit: Unit
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