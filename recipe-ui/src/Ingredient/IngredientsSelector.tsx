import {Ingredient, IngredientQuantity} from "../Types.ts";
import {useRef, useState} from "react";
import searchIngredients from "./IngredientSearchEngine.ts";
import NewIngredientModal from "./NewIngredientModal.tsx";
import {Units} from "../Unit/Units.ts";

export interface IngredientsSelectorProps {
    ingredients: Ingredient[]
    units: Units
    addIngredient: (ingredientQuantity: IngredientQuantity) => void
}

function IngredientsSelector({ingredients, units, addIngredient}: IngredientsSelectorProps) {
    const quantityFieldRef = useRef<HTMLInputElement>(null);

    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
    const [quantity, setQuantity] = useState("");
    const [autoFocusIngredients, setautoFocusIngredients] = useState(false);

    const [ingredientSearchTerm, setIngredientSearchTerm] = useState<string>("");
    const [ingredientSearchResults, setIngredientSearchResults] = useState<Ingredient[]>([]);
    const [selectedResult, setSelectedResultIndex] = useState<number | null>(null);

    const [showNewIngredientModal, setShowNewIngredientModal] = useState<boolean>(false);

    const onKeyPress = (event) => {

        if(ingredientSearchResults.length < 1) {
            return;
        }
        if(event.key === "ArrowDown") {
            if(selectedResult === null){
                setSelectedResultIndex(0);
            }else if(selectedResult < ingredientSearchResults.length -1) {
                setSelectedResultIndex(selectedResult+1);
            } else {
                setSelectedResultIndex(null);
            }
        }
        if(event.key === "ArrowUp") {
            if(selectedResult === null){
                setSelectedResultIndex(ingredientSearchResults.length-1);
            }else if(selectedResult > 0) {
                setSelectedResultIndex(selectedResult-1);
            } else {
                setSelectedResultIndex(null);
            }
        }
        if(event.key === "Enter") {
            if(selectedResult != null){
                setSelectedIngredient(ingredientSearchResults[selectedResult]);
                quantityFieldRef.current?.focus();
            }
        }
    }

    const addIngredientQuantity = () => {
        if (selectedIngredient != null) {
            addIngredient({id: null, ingredient: selectedIngredient, quantity: Number(quantity)});
            setIngredientSearchResults([]);
            setIngredientSearchTerm("");
            setSelectedResultIndex(null);
            setSelectedIngredient(null);
            setQuantity("");
        } else {
            setShowNewIngredientModal(true);
        }
    }

    return (<>
        {ingredients.length < 0 && <>Loading...</>}
            {showNewIngredientModal &&
                <NewIngredientModal
                    name={ingredientSearchTerm}
                    units={units}
                    quantity={quantity}
                    closeModal={() => {setShowNewIngredientModal(false);}}
                    ingredientCallback={addIngredient}
                />}
        {ingredients.length > 0 &&
            <>
                <div className="border">
                    {selectedIngredient === null &&
                        <input placeholder="search for ingredients"
                                autoFocus={autoFocusIngredients}
                               value={ingredientSearchTerm}
                               onKeyUp={onKeyPress}
                               onChange={(e) => {
                                   setIngredientSearchTerm(e.target.value);
                                   setIngredientSearchResults(searchIngredients(e.target.value, ingredients));
                            }}
                               onFocus={() => setautoFocusIngredients(true)}
                        />
                    }
                    {selectedIngredient &&
                        <span>{selectedIngredient.name}</span>
                    }
                    <input placeholder="qty"
                            ref={quantityFieldRef}
                           value={quantity}
                           onChange={(e) => setQuantity(e.target.value)}/>
                    {selectedIngredient?.unit.abbreviation}
                    <button onClick={() => {addIngredientQuantity()}}>Add</button>
                </div>
                {ingredientSearchResults.length > 0 &&
                    <div className="absolute bg-white w-full z-50 p-1" >
                        {ingredientSearchResults.map((ingredient, index) => (
                            <div className={"cursor-pointer " +( index === selectedResult ? "font-bold" : "")}
                                key={ingredient.id}
                                onClick={() => setSelectedIngredient(ingredient)}
                            >{ingredient.name}</div>
                        ))}
                     </div>
                }

            </>
        }
        </>
    )
}

export default IngredientsSelector;