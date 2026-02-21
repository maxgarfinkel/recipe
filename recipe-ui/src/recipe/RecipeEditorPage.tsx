import "./RecipeEditorPage.css";
import { useEffect, useReducer, useRef } from "react";
import { MDXEditorMethods } from '@mdxeditor/editor';
import { useFetchIngredients, useFetchRecipe, useFetchUnits, useSaveRecipe, useUpdateRecipe } from "../apiHooks.ts";
import IngredientsSelector from "../Ingredient/IngredientsSelector.tsx";
import { IngredientQuantity, Recipe } from "../Types.ts";
import MethodEditor from "./MethodEditor.tsx";
import IngredientList from "./IngredientList.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { useParams } from "react-router-dom";

type FormState = {
    id: bigint | null;
    name: string;
    servings: string;
    method: string;
    ingredients: IngredientQuantity[];
};

type FormAction =
    | { type: 'set_name'; value: string }
    | { type: 'set_servings'; value: string }
    | { type: 'set_method'; value: string }
    | { type: 'add_ingredient'; ingredient: IngredientQuantity }
    | { type: 'saved' }
    | { type: 'load_recipe'; recipe: Recipe };

const initialState: FormState = {
    id: null,
    name: '',
    servings: '',
    method: '',
    ingredients: [],
};

function formReducer(state: FormState, action: FormAction): FormState {
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
            };
    }
}

function RecipeEditorPage() {

    const { id } = useParams();

    const { allIngredients, ingredientLoading, ingredientError, fetchIngredients } = useFetchIngredients();
    const { units, unitLoading, unitError, fetchUnits } = useFetchUnits();
    const { savedRecipe, error: saveError, loading: saving, saveRecipe } = useSaveRecipe();
    const { recipe, loading, fetchRecipe } = useFetchRecipe();
    const { updatedRecipe, error: updateError, loading: updating, updateRecipe } = useUpdateRecipe();

    const [state, dispatch] = useReducer(formReducer, initialState);
    const { name, servings, method, ingredients } = state;

    const { showToast } = useToast();

    const ref = useRef<MDXEditorMethods>(null);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

    useEffect(() => {
        if (id) fetchRecipe(parseInt(id));
    }, [fetchRecipe, id]);

    useEffect(() => {
        if (!recipe) return;
        dispatch({ type: 'load_recipe', recipe });
        ref.current?.setMarkdown(recipe.method);
    }, [recipe]);

    useEffect(() => {
        if (!ingredientError) return;
        showToast(`Could not load ingredients: ${ingredientError}`, 'error');
    }, [ingredientError, showToast]);

    useEffect(() => {
        if (!unitError) return;
        showToast(`Could not load units: ${unitError}`, 'error');
    }, [unitError, showToast]);

    useEffect(() => {
        if (!savedRecipe) return;
        ref.current?.setMarkdown('');
        dispatch({ type: 'saved' });
        showToast('Recipe saved successfully!', 'success');
    }, [savedRecipe, showToast]);

    useEffect(() => {
        if (!saveError) return;
        showToast(`Could not save recipe: ${saveError}`, 'error');
    }, [saveError, showToast]);

    useEffect(() => {
        if (!updatedRecipe) return;
        showToast('Recipe updated successfully!', 'success');
    }, [updatedRecipe, showToast]);

    useEffect(() => {
        if (!updateError) return;
        showToast(`Could not update recipe: ${updateError}`, 'error');
    }, [updateError, showToast]);

    const handleSave = () => {
        const recipe: Recipe = {
            id: state.id,
            name,
            method,
            servings: parseInt(servings) || 0,
            ingredientQuantities: ingredients,
        };
        if (state.id !== null) {
            updateRecipe(recipe);
        } else {
            saveRecipe(recipe);
        }
    };

    const isEditing = !!id;

    return (
        <div className="py-8 px-4 md:px-0">
            <h1>{isEditing ? 'Edit Recipe' : 'New Recipe'}</h1>
            {(ingredientLoading || unitLoading || loading) && <p>Loading...</p>}
            {allIngredients && allIngredients.length > 0 && units &&
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-2 max-w-lg">
                        <label htmlFor="name" className="text-xs font-semibold uppercase tracking-widest text-mid">Recipe Name</label>
                        <input
                            placeholder="e.g. Spaghetti Bolognese"
                            id="name"
                            autoFocus={true}
                            value={name}
                            onChange={(e) => dispatch({ type: 'set_name', value: e.target.value })}
                            className="border border-gray-200 rounded-lg px-4 py-3 text-dark focus:outline-none focus:ring-2 focus:ring-mid focus:border-transparent"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="servings" className="text-xs font-semibold uppercase tracking-widest text-mid">Servings</label>
                        <input
                            placeholder="4"
                            id="servings"
                            value={servings}
                            onChange={(e) => dispatch({ type: 'set_servings', value: e.target.value })}
                            className="border border-gray-200 rounded-lg px-4 py-3 text-dark focus:outline-none focus:ring-2 focus:ring-mid focus:border-transparent w-24"
                        />
                    </div>

                    <div>
                        <h2>Ingredients</h2>
                        <IngredientList ingredients={ingredients} />
                        <IngredientsSelector
                            ingredients={allIngredients}
                            units={units}
                            addIngredient={(iq) => dispatch({ type: 'add_ingredient', ingredient: iq })}
                        />
                    </div>

                    <div>
                        <h2>Method</h2>
                        <MethodEditor
                            ref={ref}
                            value={method}
                            onChange={(v) => dispatch({ type: 'set_method', value: v })}
                        />
                    </div>

                    <div>
                        <button
                            onClick={handleSave}
                            disabled={saving || updating}
                            className="bg-dark text-white px-8 py-3 rounded-lg font-medium hover:bg-mid transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {saving || updating ? 'Saving...' : isEditing ? 'Update Recipe' : 'Save Recipe'}
                        </button>
                    </div>
                </div>
            }
        </div>
    );
}

export default RecipeEditorPage;
