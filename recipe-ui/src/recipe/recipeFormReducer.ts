import { IngredientQuantity, Recipe } from '../Types';

export type FormState = {
    id: bigint | null;
    name: string;
    servings: string;
    method: string;
    ingredients: IngredientQuantity[];
    sourceUrl: string | undefined;
};

export type FormAction =
    | { type: 'set_name'; value: string }
    | { type: 'set_servings'; value: string }
    | { type: 'set_method'; value: string }
    | { type: 'add_ingredient'; ingredient: IngredientQuantity }
    | { type: 'saved' }
    | { type: 'load_recipe'; recipe: Recipe };

export const initialState: FormState = {
    id: null,
    name: '',
    servings: '',
    method: '',
    ingredients: [],
    sourceUrl: undefined,
};

export function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
        case 'set_name':
            return { ...state, name: action.value };
        case 'set_servings':
            return { ...state, servings: action.value };
        case 'set_method':
            return { ...state, method: action.value };
        case 'add_ingredient':
            return { ...state, ingredients: [...state.ingredients, action.ingredient] };
        case 'saved':
            return { ...initialState };
        case 'load_recipe':
            return {
                id: action.recipe.id,
                name: action.recipe.name,
                servings: String(action.recipe.servings),
                method: action.recipe.method,
                ingredients: action.recipe.ingredientQuantities,
                sourceUrl: action.recipe.sourceUrl,
            };
    }
}
