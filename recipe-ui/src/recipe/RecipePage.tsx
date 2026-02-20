import {Link, useParams} from "react-router-dom";
import "./RecipePage.css";
import {useFetchRecipe} from "../apiHooks.ts";
import {useEffect, useState} from "react";
import Markdown from "react-markdown";


function RecipePage() {

    const {id} = useParams();

    const {recipe, loading, error, fetchRecipe} = useFetchRecipe();
    const [servings, setServings] = useState<number>(1);

    useEffect(() => {
        if(!id) {
            throw new Error('No recipe id provided');
        }
        fetchRecipe(parseInt(id));
    },[fetchRecipe, id]);

    useEffect(() => {
        if (recipe) setServings(recipe.servings);
    }, [recipe]);

    const formatQuantity = (value: number): string =>
        parseFloat(value.toFixed(2)).toString();

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
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setServings(s => Math.max(1, s - 1))}
                                className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-mid hover:bg-mid hover:text-white hover:border-mid transition-colors cursor-pointer"
                            >
                                −
                            </button>
                            <div className="text-sm font-medium uppercase tracking-widest text-mid">
                                {servings} serving{servings !== 1 ? 's' : ''}
                            </div>
                            <button
                                onClick={() => setServings(s => s + 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-mid hover:bg-mid hover:text-white hover:border-mid transition-colors cursor-pointer"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div>
                        <h2>Ingredients</h2>
                        <ul>
                            {recipe.ingredientQuantities.map((iq) => (
                                <li key={iq.id}>
                                    {formatQuantity(iq.quantity * servings / recipe.servings)} {iq.ingredient.unit.abbreviation} {iq.ingredient.name}
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
