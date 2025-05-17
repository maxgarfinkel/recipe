import {useEffect, useState} from "react";
import {Ingredient, Recipe, JsonUnit} from "./Types.ts";
import axios, {AxiosResponse} from "axios";
import {Units} from "./Unit/Units.ts";
import {Unit} from "./Unit/Unit.ts";

const apiBase = import.meta.env.VITE_API_BASE;

export function useGetUnits(getUnits: boolean) {

    const [units, setUnits] = useState<Units>();
    const [unitError, setUnitUnitError] = useState<string | null>(null);
    const [unitLoading, setUnitUnitLoading] = useState(false);

    useEffect(() => {
        (
            async () => {
                try {
                    setUnitUnitLoading(true);
                    const response: AxiosResponse = await axios.get(apiBase+'unit/');
                    const units: Units = new Units(response.data.map((jsonUnit: JsonUnit) => {
                        return Unit.fromJson(jsonUnit);
                    }));
                    setUnits(units);
                } catch (error) {
                    setUnitUnitError((error as Error).message);
                } finally {
                    setUnitUnitLoading(false);
                }
            }
        )()
    }, [getUnits])
    return { units, unitError, unitLoading }
}

export function useFetchRecipes(getRecipes: boolean) {

    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (
            async () => {
                try {
                    setLoading(true);
                    const response: AxiosResponse = await axios.get(apiBase+'recipe/');
                    const recipes: Recipe[] = response.data;
                    setRecipes(recipes);
                } catch (error) {
                    setError((error as Error).message);
                } finally {
                    setLoading(false);
                }
            }
        )()
    }, [getRecipes])
    return { recipes, error, loading }
}

export function useFetchRecipe(recipeId: string | undefined) {

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (
            async () => {
                try {
                    setLoading(true);
                    const id = Number.parseInt(recipeId || '')
                    if(!recipeId || isNaN(id)) {
                        setError('Invalid recipe id');
                    } else {
                        const response: AxiosResponse = await axios.get(apiBase+'recipe/'+recipeId);
                        const recipe: Recipe = response.data;
                        setRecipe(recipe);
                    }
                } catch (error) {
                    setError((error as Error).message);
                } finally {
                    setLoading(false);
                }
            }
        )()
    }, [recipeId])
    return { recipe, error, loading }
}


export function useSaveRecipe(getRecipes: boolean) {

    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (
            async () => {
                try {
                    setLoading(true);
                    const response: AxiosResponse = await axios.get(apiBase+'recipe/');
                    const recipes: Recipe[] = response.data;
                    setRecipes(recipes);
                } catch (error) {
                    setError((error as Error).message);
                } finally {
                    setLoading(false);
                }
            }
        )()
    }, [getRecipes])
    return { recipes, error, loading }
}

export function useGetIngredients(getIngredients: boolean) {

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (
            async () => {
                try {
                    setLoading(true);
                    const response: AxiosResponse = await axios.get(apiBase+'ingredient/');
                    const ingredients: Ingredient[] = response.data;
                    setIngredients(ingredients);
                } catch (error) {
                    setError((error as Error).message);
                } finally {
                    setLoading(false);
                }
            }
        )()
    }, [getIngredients])
    return { allIngredients: ingredients, ingredientError: error, ingredientLoading: loading }
}

