import {Link, useParams} from "react-router-dom";
import "./RecipePage.css";
import {useFetchRecipe} from "../apiHooks.ts";
import {useEffect} from "react";
import Markdown from "react-markdown";


function RecipePage() {

    const {id} = useParams();

    const {recipe, loading, error, fetchRecipe} = useFetchRecipe();

    useEffect(() => {
        if(!id) {
            throw new Error('No recipe id provided');
        }
        const recipeId = parseInt(id);
        fetchRecipe(recipeId)
    },[fetchRecipe, id])

    return (
        <div className="py-8 px-4 md:px-0">
            {loading && <p>Loading...</p>}
            {error && <p>There was an error loading the recipe</p>}
            {recipe &&
                <div className="flex flex-col gap-10">
                    <div>
                        <Link to={'/'} className="block mb-2 text-xs font-semibold uppercase tracking-widest text-mid hover:text-dark transition-colors">
                            &lsaquo; All recipes
                        </Link>
                        <h1>{recipe.name}</h1>
                        <div className="text-sm font-medium uppercase tracking-widest text-mid">
                            {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}
                        </div>
                    </div>

                    <div>
                        <h2>Ingredients</h2>
                        <ul>
                            {recipe.ingredientQuantities.map((iq) => (
                                <li key={iq.id}>
                                    {iq.quantity} {iq.ingredient.unit.abbreviation} {iq.ingredient.name}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2>Method</h2>
                        <Markdown>{recipe.method}</Markdown>
                    </div>
                </div>
            }
        </div>
    )
}

export default RecipePage;
