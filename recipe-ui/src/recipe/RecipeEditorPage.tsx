import {
    headingsPlugin,
    linkPlugin,
    listsPlugin,
    markdownShortcutPlugin,
    MDXEditor,
    MDXEditorMethods,
    toolbarPlugin,
    UndoRedo,
    Separator,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    ListsToggle,
} from '@mdxeditor/editor'
import "./RecipeEditorPage.css";

import '@mdxeditor/editor/style.css'
import {useEffect, useRef, useState} from "react";
import {useFetchIngredients, useFetchUnits, useSaveRecipe} from "../apiHooks.ts";
import IngredientsSelector from "../Ingredient/IngredientsSelector.tsx";
import {IngredientQuantity, Recipe} from "../Types.ts";

function RecipeEditorPage() {

    const {allIngredients, ingredientLoading, ingredientError, fetchIngredients} = useFetchIngredients();
    const {units, unitLoading, unitError, fetchUnits} = useFetchUnits();
    const {savedRecipe, error: saveError, loading: saving, saveRecipe} = useSaveRecipe();

    const [method, setMethod] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [servings, setServings] = useState<string>("");
    const [ingredients, setIngredients] = useState<IngredientQuantity[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const ref = useRef<MDXEditorMethods>(null);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

    useEffect(() => {
        if (!savedRecipe) return;
        setName('');
        setServings('');
        setIngredients([]);
        setMethod('');
        ref.current?.setMarkdown('');
        setToast({ message: 'Recipe saved successfully!', type: 'success' });
    }, [savedRecipe]);

    useEffect(() => {
        if (!saveError) return;
        setToast({ message: `Could not save recipe: ${saveError}`, type: 'error' });
    }, [saveError]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    const addIngredient = (ingredient: IngredientQuantity) => {
        setIngredients([...ingredients, ingredient]);
    };

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
            {ingredientLoading || unitLoading && <p>Loading...</p>}
            {ingredientError || unitError && <p>Error</p>}
            {allIngredients && allIngredients.length > 0 && units &&
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-2 max-w-lg">
                        <label htmlFor="name" className="text-xs font-semibold uppercase tracking-widest text-mid">Recipe Name</label>
                        <input
                            placeholder="e.g. Spaghetti Bolognese"
                            id="name"
                            autoFocus={true}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border border-gray-200 rounded-lg px-4 py-3 text-dark focus:outline-none focus:ring-2 focus:ring-mid focus:border-transparent"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="servings" className="text-xs font-semibold uppercase tracking-widest text-mid">Servings</label>
                        <input
                            placeholder="4"
                            id="servings"
                            value={servings}
                            onChange={(e) => setServings(e.target.value)}
                            className="border border-gray-200 rounded-lg px-4 py-3 text-dark focus:outline-none focus:ring-2 focus:ring-mid focus:border-transparent w-24"
                        />
                    </div>

                    <div>
                        <h2>Ingredients</h2>
                        {ingredients.length > 0 &&
                            <ul>
                                {ingredients.map((ingredient) => (
                                    <li key={ingredient.ingredient.id}>
                                        {ingredient.quantity} {ingredient.ingredient.unit.abbreviation} {ingredient.ingredient.name}
                                    </li>
                                ))}
                            </ul>
                        }
                        <IngredientsSelector ingredients={allIngredients} units={units} addIngredient={addIngredient} />
                    </div>

                    <div>
                        <h2>Method</h2>
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <MDXEditor
                                ref={ref}
                                markdown={method}
                                onChange={(e) => setMethod(e)}
                                plugins={[
                                    toolbarPlugin({
                                        toolbarContents: () => (<>
                                            <UndoRedo />
                                            <Separator />
                                            <BlockTypeSelect />
                                            <Separator />
                                            <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
                                            <Separator />
                                            <ListsToggle options={['bullet', 'number']} />
                                        </>)
                                    }),
                                    headingsPlugin(),
                                    listsPlugin(),
                                    linkPlugin(),
                                    markdownShortcutPlugin(),
                                ]}
                            />
                        </div>
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
                        onClick={() => setToast(null)}
                        className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer text-lg leading-none"
                    >
                        &times;
                    </button>
                </div>
            )}
        </div>
    )
}

export default RecipeEditorPage;
