import { expect, test } from 'vitest'
import {Ingredient, Unit} from "../Types.ts";
import searchIngredients from "./IngredientSearchEngine.ts";

const gram:Unit = {id:BigInt(1), name:"gram", abbreviation:"g", base:null, baseFactor:1}
const ingredients:Ingredient[] = [
    {id:BigInt(0), name:"a", unit:gram},
    {id:BigInt(1), name:"ab", unit:gram},
    {id:BigInt(2), name:"b", unit:gram},
    {id:BigInt(3), name:"ba", unit:gram},
    {id:BigInt(4), name:"c", unit:gram},
    {id:BigInt(5), name:"d", unit:gram},
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