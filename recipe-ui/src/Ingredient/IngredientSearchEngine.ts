import {Ingredient} from "../Types.ts";

function searchIngredients(searchTerm: string, ingredients: Ingredient[]): Ingredient[] {
    if(!searchTerm) {return []}
    return ingredients.filter((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
}

export default searchIngredients;