import {Link, useParams} from "react-router-dom";
import "./RecipePage.css";
import {useFetchRecipe} from "../apiHooks.ts";
import {useEffect, useReducer} from "react";
import Markdown from "react-markdown";
import {useToast} from "../context/ToastContext.tsx";


type ServingsAction =
    | { type: 'init'; value: number }
    | { type: 'increment' }
    | { type: 'decrement' };

function servingsReducer(state: number, action: ServingsAction): number {
    switch (action.type) {
        case 'init':      return action.value;
        case 'increment': return state + 1;
        case 'decrement': return Math.max(1, state - 1);
    }
}

function RecipePage() {

    const {id} = useParams();

    const {recipe, loading, error, fetchRecipe} = useFetchRecipe();
    const [servings, dispatch] = useReducer(servingsReducer, 1);
    const {showToast} = useToast();

    useEffect(() => {
        if(!id) {
            throw new Error('No recipe id provided');
        }
        fetchRecipe(parseInt(id));
    },[fetchRecipe, id]);

    useEffect(() => {
        if (recipe) dispatch({ type: 'init', value: recipe.servings });
    }, [recipe]);

    useEffect(() => {
        if (!error) return;
        showToast(`Could not load recipe: ${error}`, 'error');
    }, [error, showToast]);

    const formatQuantity = (value: number): string =>
        parseFloat(value.toFixed(2)).toString();

    return (
        <div className="py-8 px-4 md:px-0">
            {loading && <p>Loading...</p>}
            {recipe &&
                <div className="flex flex-col gap-10">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Link to={'/'} className="text-xs font-semibold uppercase tracking-widest text-mid hover:text-dark transition-colors">
                                &lsaquo; All recipes
                            </Link>
                            <Link to={`/recipe/${id}/edit`} className="text-xs font-semibold uppercase tracking-widest text-mid hover:text-dark transition-colors">
                                Edit recipe &rarr;
                            </Link>
                        </div>
                        <h1>{recipe.name}</h1>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => dispatch({ type: 'decrement' })}
                                className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-mid hover:bg-mid hover:text-white hover:border-mid transition-colors cursor-pointer"
                            >
                                −
                            </button>
                            <div className="text-sm font-medium uppercase tracking-widest text-mid">
                                {servings} serving{servings !== 1 ? 's' : ''}
                            </div>
                            <button
                                onClick={() => dispatch({ type: 'increment' })}
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
