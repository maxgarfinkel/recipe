import {useFetchRecipes} from "../apiHooks.ts";
import {Recipe} from "../Types.ts";
import "./RecipeMenu.css";
import {Link} from "react-router-dom";

function alphabeticalRecipes(recipes: Recipe[]): Map<string, Recipe[]> {
    const alphabeticalRecipes = new Map<string, Recipe[]>();
    recipes.forEach((recipe) => {
        if(alphabeticalRecipes.has(recipe.name[0].toLocaleLowerCase())) {
            alphabeticalRecipes.get(recipe.name[0].toLocaleLowerCase())?.push(recipe);
        } else {
            alphabeticalRecipes.set(recipe.name[0].toLocaleLowerCase(), [recipe]);
        }
    })
    return alphabeticalRecipes;
}

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

function RecipeMenu() {

    const {recipes,loading,error} = useFetchRecipes(true);

    return (<>
    <h1>Recipes</h1>
        {loading && <p>Loading recipes...</p>}
        {error && <p>There was an error loading recipes</p>}
        {recipes &&
            <>
                {
                    alphabet.map((letter) =>
                        <div key={letter}>
                            <h2>{letter.toLocaleUpperCase()}</h2>
                            <ul>
                                {alphabeticalRecipes(recipes).get(letter)?.map(recipe =>
                                    <li key={recipe.id}>
                                        <Link to={`/recipe/${recipe.id}`}>{recipe.name}</Link>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )
                }
            </>
        }
    </>)
}

export default RecipeMenu;