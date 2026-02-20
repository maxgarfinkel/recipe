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
            <div className="relative">
                <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 bg-white focus-within:ring-2 focus-within:ring-mid focus-within:border-transparent">
                    {selectedIngredient === null &&
                        <input
                            placeholder="search for ingredients"
                            autoFocus={autoFocusIngredients}
                            value={ingredientSearchTerm}
                            onKeyUp={onKeyPress}
                            onChange={(e) => {
                                setIngredientSearchTerm(e.target.value);
                                setIngredientSearchResults(searchIngredients(e.target.value, ingredients));
                            }}
                            onFocus={() => setautoFocusIngredients(true)}
                            className="flex-1 min-w-0 focus:outline-none text-dark"
                        />
                    }
                    {selectedIngredient &&
                        <span className="flex-1 text-dark">{selectedIngredient.name}</span>
                    }
                    <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                        <input
                            placeholder="qty"
                            ref={quantityFieldRef}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-14 focus:outline-none text-dark text-right"
                        />
                        {selectedIngredient?.unit.abbreviation &&
                            <span className="text-gray-400 text-sm w-6">{selectedIngredient.unit.abbreviation}</span>
                        }
                    </div>
                    <button
                        onClick={() => addIngredientQuantity()}
                        className="bg-mid text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-dark transition-colors cursor-pointer"
                    >
                        Add
                    </button>
                </div>
                {ingredientSearchResults.length > 0 &&
                    <div className="absolute bg-white rounded-lg shadow-lg border border-gray-100 w-full z-50 py-1 mt-1">
                        {ingredientSearchResults.map((ingredient, index) => (
                            <div
                                className={"px-4 py-2 cursor-pointer " + (index === selectedResult ? "bg-mid text-white" : "text-dark hover:bg-gray-50")}
                                key={ingredient.id}
                                onClick={() => setSelectedIngredient(ingredient)}
                            >{ingredient.name}</div>
                        ))}
                    </div>
                }
            </div>
        }
        </>
    )
}

export default IngredientsSelector;