import {Link, useParams} from "react-router-dom";
import "./RecipePage.css";
import {useFetchRecipe} from "../apiHooks.ts";
import {useEffect} from "react";


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
        <>
            {loading && <p>Loading recipes...</p>}
            {error && <p>There was an error loading recipes</p>}
            {recipe &&
                <>
                    <Link to={'/'}>&lsaquo; All recipes</Link>
                    <h1>{recipe.name}</h1>
                    <p>Quantity for {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</p>
                    <h2>Ingredients</h2>
                    <ul>
                        {recipe.ingredientQuantities.map((ingredientQuantities => (
                            <li key={ingredientQuantities.id}>
                                {ingredientQuantities.quantity} {ingredientQuantities.ingredient.unit.abbreviation} {ingredientQuantities.ingredient.name}
                            </li>
                        )))}
                    </ul>
                    <h2>Method</h2>
                    <p>{recipe.method}</p>
                </>
            }
        </>)
}

export default RecipePage;