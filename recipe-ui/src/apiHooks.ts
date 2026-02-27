import { useCallback } from "react";
import { Ingredient, IngredientAlias, PageResponse, Recipe, JsonUnit, RecipeImportDraft } from "./Types.ts";
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

export function useUpdateRecipe() {
    const { data: updatedRecipe, error, loading, execute } = useAsync<Recipe>();

    const updateRecipe = useCallback((recipe: Recipe) => {
        return execute(() => api.put<Recipe>(`recipe/${recipe.id}`, recipe).then(r => r.data));
    }, [execute]);

    return { updatedRecipe, error, loading, updateRecipe };
}

export function useFetchIngredients() {
    const { data, error, loading, execute } = useAsync<Ingredient[]>();

    const fetchIngredients = useCallback(() => {
        execute(() => api.get<Ingredient[]>('ingredient/').then(r => r.data));
    }, [execute]);

    return { allIngredients: data ?? [], ingredientError: error, ingredientLoading: loading, fetchIngredients };
}

export function useDeleteRecipe() {
    const { data: deleted, error, loading, execute } = useAsync<boolean>();

    const deleteRecipe = useCallback((id: number) => {
        return execute(() => api.delete(`recipe/${id}`).then(() => true));
    }, [execute]);

    return { deleted, error, loading, deleteRecipe };
}

export function useSaveIngredient() {
    const { data: savedIngredient, error: saveIngredientError, loading: saveIngredientLoading, execute } = useAsync<Ingredient>();

    const saveIngredient = useCallback((ingredient: Ingredient) => {
        return execute(() => api.post<Ingredient>('ingredient/', ingredient).then(r => r.data));
    }, [execute]);

    return { savedIngredient, saveIngredientError, saveIngredientLoading, saveIngredient };
}

export function useImportRecipe() {
    const { data: importDraft, error, loading, execute } = useAsync<RecipeImportDraft>();

    const importRecipe = useCallback((url: string) =>
        execute(() => api.post<RecipeImportDraft>('recipe/import/preview', { url }).then(r => r.data))
    , [execute]);

    return { importDraft, error, loading, importRecipe };
}

export function useFetchIngredientPage() {
    const { data: ingredientPage, error, loading, execute } = useAsync<PageResponse<Ingredient>>();

    const fetchIngredientPage = useCallback((page: number, size: number) => {
        execute(() =>
            api.get<PageResponse<Ingredient>>(`ingredient/page?page=${page}&size=${size}`).then(r => r.data)
        );
    }, [execute]);

    return { ingredientPage, loading, error, fetchIngredientPage };
}

export function useUpdateIngredient() {
    const { data: updatedIngredient, error, loading, execute } = useAsync<Ingredient>();

    const updateIngredient = useCallback((ingredient: Ingredient) => {
        return execute(() =>
            api.put<Ingredient>(`ingredient/${ingredient.id}`, ingredient).then(r => r.data)
        );
    }, [execute]);

    return { updatedIngredient, loading, error, updateIngredient };
}

export function useFetchIngredientAliases() {
    const { data: aliases, error: aliasError, loading: aliasLoading, execute } = useAsync<IngredientAlias[]>();

    const fetchAliases = useCallback((ingredientId: bigint) => {
        execute(() =>
            api.get<IngredientAlias[]>(`ingredient/${ingredientId}/alias`).then(r => r.data)
        );
    }, [execute]);

    return { aliases, aliasError, aliasLoading, fetchAliases };
}

export function useDeleteIngredientAlias() {
    const { data: deleted, error, loading, execute } = useAsync<boolean>();

    const deleteAlias = useCallback((id: bigint) => {
        return execute(() => api.delete(`ingredient-alias/${id}`).then(() => true));
    }, [execute]);

    return { deleted, loading, error, deleteAlias };
}

export function useSaveIngredientAlias() {
    const { execute } = useAsync<void>();

    const saveIngredientAlias = useCallback((aliasText: string, ingredientId: bigint, unitId: bigint) => {
        return execute(() =>
            api.post('ingredient-alias/', { aliasText, ingredientId: ingredientId.toString(), unitId: unitId.toString() })
                .then(() => undefined)
        );
    }, [execute]);

    return { saveIngredientAlias };
}
