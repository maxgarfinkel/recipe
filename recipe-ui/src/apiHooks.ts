import { useCallback } from "react";
import { Ingredient, Recipe, JsonUnit } from "./Types.ts";
import { Units } from "./Unit/Units.ts";
import { Unit } from "./Unit/Unit.ts";
import api from "./api.ts";
import { useAsync } from "./hooks/useAsync.ts";

export function useFetchUnits() {
    const { data: units, error: unitError, loading: unitLoading, execute } = useAsync<Units>();

    const fetchUnits = useCallback(() => {
        execute(() =>
            api.get<JsonUnit[]>('unit/').then(r =>
                new Units(r.data.map((jsonUnit: JsonUnit) => Unit.fromJson(jsonUnit)))
            )
        );
    }, [execute]);

    return { units, unitError, unitLoading, fetchUnits };
}

export function useFetchRecipes() {
    const { data, error, loading, execute } = useAsync<Recipe[]>();

    const fetchRecipes = useCallback(() => {
        execute(() => api.get<Recipe[]>('recipe/').then(r => r.data));
    }, [execute]);

    return { recipes: data ?? [], error, loading, fetchRecipes };
}

export function useFetchRecipe() {
    const { data: recipe, error, loading, execute } = useAsync<Recipe>();

    const fetchRecipe = useCallback((recipeId: number) => {
        execute(() => api.get<Recipe>(`recipe/${recipeId}`).then(r => r.data));
    }, [execute]);

    return { recipe: recipe ?? null, error, loading, fetchRecipe };
}

export function useSaveRecipe() {
    const { data: savedRecipe, error, loading, execute } = useAsync<Recipe>();

    const saveRecipe = useCallback((recipe: Recipe) => {
        return execute(() => api.post<Recipe>('recipe/', recipe).then(r => r.data));
    }, [execute]);

    return { savedRecipe, error, loading, saveRecipe };
}

export function useFetchIngredients() {
    const { data, error, loading, execute } = useAsync<Ingredient[]>();

    const fetchIngredients = useCallback(() => {
        execute(() => api.get<Ingredient[]>('ingredient/').then(r => r.data));
    }, [execute]);

    return { allIngredients: data ?? [], ingredientError: error, ingredientLoading: loading, fetchIngredients };
}

export function useSaveIngredient() {
    const { data: savedIngredient, error: saveIngredientError, loading: saveIngredientLoading, execute } = useAsync<Ingredient>();

    const saveIngredient = useCallback((ingredient: Ingredient) => {
        return execute(() => api.post<Ingredient>('ingredient/', ingredient).then(r => r.data));
    }, [execute]);

    return { savedIngredient, saveIngredientError, saveIngredientLoading, saveIngredient };
}
