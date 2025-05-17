import {IngredientQuantity} from "../Types.ts";
import {useEffect, useRef, useState} from "react";
import {Units} from "../Unit/Units.ts";

export interface NewIngredientModalProps {
    name: string;
    quantity: string;
    units: Units;
    closeModal: () => void;
    ingredientCallback: (ingredient: IngredientQuantity) => void;
}

function NewIngredientModal({...props}: NewIngredientModalProps) {
    const closeModal = props.closeModal;
    const units = props.units;

    const [name, setName] = useState(props.name);
    const [quantity, setQuantity] = useState(props.quantity);
    const [selectedUnitId, setSelectedUnitId] = useState(units.getFirst().id.toString());

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus the input when modal opens
        inputRef.current?.focus();
    }, []);

    const createNewIngredient = () => {
        console.log(selectedUnitId, units);
        const unit = units.getUnit(selectedUnitId)
        const ingredient: IngredientQuantity = {
            id: null,
            ingredient: {
                id:null,
                name: name,
                unit: unit
            },
            quantity: Number.parseInt(quantity)
        }
        props.ingredientCallback(ingredient);
        closeModal();
    }


    return(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-[90%] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add a new ingredient</h2>
                <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={closeModal}
                >
                    <span className="text-2xl">&times;</span>
                </button>
            </div>

            {/* Modal Content */}
            <div className="mb-6">
                <input ref={inputRef} className="border border-gray-200" value={name} onChange={(e) => setName(e.target.value)} />
                <input className="border border-gray-200" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                <select
                    value={selectedUnitId.toString()}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="border border-gray-200"
                >
                    <option value="">Select unit</option>
                    {units.units.map((unit) => (
                        <option key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                        </option>
                    ))}
                </select>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2">
                <button
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    onClick={closeModal}
                >
                    Cancel
                </button>
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={createNewIngredient}
                >
                    Confirm
                </button>
            </div>
        </div>
    </div>)
}

export default NewIngredientModal;