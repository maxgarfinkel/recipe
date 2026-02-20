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
import {useFetchIngredients, useFetchUnits} from "../apiHooks.ts";
import IngredientsSelector from "../Ingredient/IngredientsSelector.tsx";
import {IngredientQuantity} from "../Types.ts";

function RecipePage() {

    const {allIngredients, ingredientLoading, ingredientError, fetchIngredients} = useFetchIngredients();
    const {units, unitLoading, unitError, fetchUnits} = useFetchUnits();

    const [method, setMethod] = useState<string>("method");
    const [name, setName] = useState<string>("");
    const [servings, setServings] = useState<string>();
    const [ingredients, setIngredients] = useState<IngredientQuantity[]>([]);

    useEffect(() => {
        fetchUnits();
    },[fetchUnits]);

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

    const addIngredient = (ingredient: IngredientQuantity) => {
        console.log(ingredient);
        setIngredients([...ingredients, ingredient])
    }

    const ref = useRef<MDXEditorMethods>(null)
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
                </div>
            }
        </div>
    )
}

export default RecipePage;