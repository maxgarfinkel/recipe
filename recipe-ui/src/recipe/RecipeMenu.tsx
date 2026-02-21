import {useFetchRecipes} from "../apiHooks.ts";
import "./RecipeMenu.css";
import {Link} from "react-router-dom";
import {useEffect} from "react";
import {useToast} from "../context/ToastContext.tsx";

function RecipeMenu() {

    const {recipes, loading, error, fetchRecipes} = useFetchRecipes();
    const {showToast} = useToast();

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    useEffect(() => {
        if (!error) return;
        showToast(`Could not load recipes: ${error}`, 'error');
    }, [error, showToast]);

    const sorted = [...recipes].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="py-8 px-4 md:px-0">
            <h1>Recipes</h1>

            {loading && <p className="text-gray-400">Loading recipes...</p>}

            {!loading && sorted.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                    <p className="text-gray-400">No recipes yet.</p>
                    <Link
                        to="/new-recipe"
                        className="text-xs font-semibold uppercase tracking-widest text-mid hover:text-dark transition-colors"
                    >
                        Add your first recipe →
                    </Link>
                </div>
            )}

            {sorted.length > 0 && (
                <div className="divide-y divide-gray-100">
                    {sorted.map(recipe => (
                        <Link
                            key={String(recipe.id)}
                            to={`/recipe/${recipe.id}`}
                            className="flex items-center justify-between py-4 px-3 -mx-3 rounded-lg group hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-dark group-hover:text-mid transition-colors">
                                    {recipe.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
                                    {recipe.ingredientQuantities.length > 0 && (
                                        <> · {recipe.ingredientQuantities.length} ingredient{recipe.ingredientQuantities.length !== 1 ? 's' : ''}</>
                                    )}
                                </span>
                            </div>
                            <span className="text-gray-300 group-hover:text-mid transition-colors text-xl leading-none">
                                ›
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RecipeMenu;
