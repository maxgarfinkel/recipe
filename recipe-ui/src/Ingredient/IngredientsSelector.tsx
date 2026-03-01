import {Ingredient, IngredientQuantity} from "../Types.ts";
import {useRef, useState} from "react";
import searchIngredients from "./IngredientSearchEngine.ts";
import NewIngredientModal from "./NewIngredientModal.tsx";
import {Units} from "../Unit/Units.ts";

export interface IngredientsSelectorProps {
    ingredients: Ingredient[]
    units: Units
    addIngredient: (ingredientQuantity: IngredientQuantity) => void
    initialSearchTerm?: string
    initialQuantity?: number
    initialUnitNameHint?: string
}

function IngredientsSelector({ingredients, units, addIngredient, initialSearchTerm, initialQuantity, initialUnitNameHint}: IngredientsSelectorProps) {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const quantityFieldRef = useRef<HTMLInputElement>(null);

    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<string>("");
    const [quantity, setQuantity] = useState(initialQuantity != null ? String(initialQuantity) : "");

    const [ingredientSearchTerm, setIngredientSearchTerm] = useState<string>(initialSearchTerm ?? "");
    const [ingredientSearchResults, setIngredientSearchResults] = useState<Ingredient[]>(
        initialSearchTerm ? searchIngredients(initialSearchTerm, ingredients) : []
    );
    const [selectedResult, setSelectedResultIndex] = useState<number | null>(null);

    const [showNewIngredientModal, setShowNewIngredientModal] = useState<boolean>(false);

    const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {

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
                selectIngredient(ingredientSearchResults[selectedResult]);
            }
        }
    }

    const selectIngredient = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient);
        const hintUnit = initialUnitNameHint
            ? units.units.find(u =>
                u.name.toLowerCase() === initialUnitNameHint.toLowerCase() ||
                u.abbreviation.toLowerCase() === initialUnitNameHint.toLowerCase())
            : null;
        setSelectedUnitId((hintUnit ?? ingredient.defaultUnit).id.toString());
        setIngredientSearchResults([]);
        quantityFieldRef.current?.focus();
    }

    const reset = () => {
        setIngredientSearchResults([]);
        setIngredientSearchTerm("");
        setSelectedResultIndex(null);
        setSelectedIngredient(null);
        setSelectedUnitId("");
        setQuantity("");
        setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    const addIngredientQuantity = () => {
        if (selectedIngredient != null) {
            addIngredient({id: null, ingredient: selectedIngredient, unit: units.getUnit(selectedUnitId), quantity: Number(quantity)});
            reset();
        } else {
            setShowNewIngredientModal(true);
        }
    }

    const handleNewIngredient = (iq: IngredientQuantity) => {
        addIngredient(iq);
        reset();
    }

    return (<>
        {showNewIngredientModal &&
            <NewIngredientModal
                name={ingredientSearchTerm}
                units={units}
                quantity={quantity}
                closeModal={() => {setShowNewIngredientModal(false);}}
                ingredientCallback={handleNewIngredient}
            />}
        <div className="relative">
                <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 bg-white focus-within:ring-2 focus-within:ring-mid focus-within:border-transparent">
                    {selectedIngredient === null &&
                        <input
                            ref={searchInputRef}
                            placeholder="search for ingredients"
                            value={ingredientSearchTerm}
                            onKeyUp={onKeyPress}
                            onChange={(e) => {
                                setIngredientSearchTerm(e.target.value);
                                setIngredientSearchResults(searchIngredients(e.target.value, ingredients));
                            }}
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
                        {selectedIngredient && (
                            <select
                                value={selectedUnitId}
                                onChange={(e) => setSelectedUnitId(e.target.value)}
                                className="text-gray-400 text-sm focus:outline-none bg-transparent cursor-pointer"
                            >
                                {units.units.map(unit => (
                                    <option key={unit.id.toString()} value={unit.id.toString()}>
                                        {unit.abbreviation || unit.name}
                                    </option>
                                ))}
                            </select>
                        )}
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
                                onClick={() => selectIngredient(ingredient)}
                            >{ingredient.name}</div>
                        ))}
                    </div>
                }
            </div>
        </>
    )
}

export default IngredientsSelector;