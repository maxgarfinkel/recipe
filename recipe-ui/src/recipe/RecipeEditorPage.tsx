import {
    headingsPlugin,
    linkPlugin,
    listsPlugin,
    markdownShortcutPlugin,
    MDXEditor,
    MDXEditorMethods
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
        <div>
            <h1>New Recipe</h1>
            {ingredientLoading || unitLoading && <p>Loading...</p>}
            {ingredientError || unitError && <p>Error</p>}
            {allIngredients && allIngredients.length > 0 && units &&
                <>
                    <div>
                        <label htmlFor="name">Recipe Name</label>
                        <input placeholder="name" id="name" autoFocus={true} value={name} onChange={(e) => setName(e.target.value)} />

                    </div>
                    <div>
                        <label htmlFor="servings">Servings</label>
                        <input placeholder="4" id="servings" value={servings} onChange={(e) => setServings(e.target.value)} />
                    </div>
                    <div>
                        <p>Ingredients</p>
                        {ingredients.map((ingredient) => (
                            <div key={ingredient.ingredient.id}>
                                {ingredient.quantity} {ingredient.ingredient.unit.abbreviation} {ingredient.ingredient.name}
                            </div>
                        ))}
                        <IngredientsSelector ingredients={allIngredients} units={units} addIngredient={addIngredient} />
                    </div>
                    <div className="border">
                        <MDXEditor ref={ref} markdown={method} onChange={(e) => setMethod(e)}
                                   plugins={[headingsPlugin(), listsPlugin(), linkPlugin(), markdownShortcutPlugin()]} />
                    </div>
                </>
            }
        </div>
    )
}

export default RecipePage;