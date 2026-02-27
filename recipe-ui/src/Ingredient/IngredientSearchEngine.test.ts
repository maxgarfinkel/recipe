import { expect, test } from 'vitest'
import {Ingredient, JsonUnit} from "../Types.ts";
import searchIngredients from "./IngredientSearchEngine.ts";

const gram:JsonUnit = {id:BigInt(1), name:"gram", abbreviation:"g", base:null, baseFactor:1}
const ingredients:Ingredient[] = [
    {id:BigInt(0), name:"a", defaultUnit:gram},
    {id:BigInt(1), name:"ab", defaultUnit:gram},
    {id:BigInt(2), name:"b", defaultUnit:gram},
    {id:BigInt(3), name:"ba", defaultUnit:gram},
    {id:BigInt(4), name:"c", defaultUnit:gram},
    {id:BigInt(5), name:"d", defaultUnit:gram},
]


test("Basic search is basic 1", () => {
    const result = searchIngredients("a", ingredients)
    expect(result.length).toBe(3);
})

test("Basic search is basic 2", () => {
    const result = searchIngredients("ab", ingredients)
    expect(result.length).toBe(1);
})

test("Basic search is basic 3", () => {
    const result = searchIngredients("ba", ingredients)
    expect(result.length).toBe(1);
})

test("Basic search is basic 4", () => {
    const result = searchIngredients("abc", ingredients)
    expect(result.length).toBe(0);
})