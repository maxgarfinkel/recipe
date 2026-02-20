import "./RecipeEditorPage.css";
import { useEffect, useReducer, useRef } from "react";
import { MDXEditorMethods } from '@mdxeditor/editor';
import { useFetchIngredients, useFetchUnits, useSaveRecipe } from "../apiHooks.ts";
import IngredientsSelector from "../Ingredient/IngredientsSelector.tsx";
import { IngredientQuantity, Recipe } from "../Types.ts";
import MethodEditor from "./MethodEditor.tsx";
import IngredientList from "./IngredientList.tsx";
import { useToast } from "../hooks/useToast.ts";

type FormState = {
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
    | { type: 'saved' };

const initialState: FormState = {
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
    }
}

function RecipeEditorPage() {

    const { allIngredients, ingredientLoading, ingredientError, fetchIngredients } = useFetchIngredients();
    const { units, unitLoading, unitError, fetchUnits } = useFetchUnits();
    const { savedRecipe, error: saveError, loading: saving, saveRecipe } = useSaveRecipe();

    const [state, dispatch] = useReducer(formReducer, initialState);
    const { name, servings, method, ingredients } = state;

    const { toast, showToast, dismissToast } = useToast();

    const ref = useRef<MDXEditorMethods>(null);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

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

    const handleSave = () => {
        const recipe: Recipe = {
            id: null,
            name,
            method,
            servings: parseInt(servings) || 0,
            ingredientQuantities: ingredients,
        };
        saveRecipe(recipe);
    };

    return (
        <div className="py-8 px-4 md:px-0">
            <h1>New Recipe</h1>
            {(ingredientLoading || unitLoading) && <p>Loading...</p>}
            {(ingredientError || unitError) && <p>Error</p>}
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
                            disabled={saving}
                            className="bg-dark text-white px-8 py-3 rounded-lg font-medium hover:bg-mid transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Recipe'}
                        </button>
                    </div>
                </div>
            }

            {toast && (
                <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-4 px-5 py-4 rounded-xl shadow-xl text-white text-sm font-medium max-w-sm
                    ${toast.type === 'success' ? 'bg-mid' : 'bg-red-600'}`}>
                    <span className="flex-1">{toast.message}</span>
                    <button
                        aria-label="Dismiss"
                        onClick={dismissToast}
                        className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer text-lg leading-none"
                    >
                        &times;
                    </button>
                </div>
            )}
        </div>
    );
}

export default RecipeEditorPage;
