import {IngredientQuantity} from "../Types.ts";
import {useEffect, useRef, useState} from "react";
import {Units} from "../Unit/Units.ts";
import {useSaveIngredient} from "../apiHooks.ts";
import {useToast} from "../context/ToastContext.tsx";

export interface NewIngredientModalProps {
    name: string;
    quantity: string;
    units: Units;
    closeModal: () => void;
    ingredientCallback: (ingredient: IngredientQuantity) => void;
}

function NewIngredientModal({ name: initialName, quantity: initialQuantity, units, closeModal, ingredientCallback }: NewIngredientModalProps) {
    const {savedIngredient, saveIngredientError, saveIngredient} = useSaveIngredient();
    const {showToast} = useToast();
    const [name, setName] = useState(initialName);
    const [quantity, setQuantity] = useState(initialQuantity);
    const [selectedUnitId, setSelectedUnitId] = useState(units.getFirst().id.toString());

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if(savedIngredient) {
            ingredientCallback({
                id: null,
                ingredient: savedIngredient,
                unit: savedIngredient.defaultUnit,
                quantity: parseInt(quantity)
            });
            closeModal();
        }
    }, [savedIngredient, ingredientCallback, closeModal, quantity]);

    useEffect(() => {
        if (!saveIngredientError) return;
        showToast(`Could not save ingredient: ${saveIngredientError}`, 'error');
    }, [saveIngredientError, showToast]);

    const createNewIngredient = () => {
        const unit = units.getUnit(selectedUnitId)

        saveIngredient({
            id: null,
            name: name,
            defaultUnit: {
                id: unit.id,
                name: unit.name,
                abbreviation: unit.abbreviation,
                base: unit.base,
                baseFactor: unit.baseFactor
            }
        });
    }


    return(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="text-xl font-bold text-dark">New Ingredient</div>
                <button
                    className="text-gray-400 hover:text-dark transition-colors cursor-pointer leading-none"
                    onClick={closeModal}
                >
                    <span className="text-2xl">&times;</span>
                </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col gap-5 mb-8">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-mid">Name</label>
                    <input
                        ref={inputRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border border-gray-200 rounded-lg px-4 py-3 text-dark focus:outline-none focus:ring-2 focus:ring-mid focus:border-transparent"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-mid">Quantity</label>
                    <input
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="border border-gray-200 rounded-lg px-4 py-3 text-dark focus:outline-none focus:ring-2 focus:ring-mid focus:border-transparent"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-mid">Unit</label>
                    <select
                        value={selectedUnitId.toString()}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        className="border border-gray-200 rounded-lg px-4 py-3 text-dark focus:outline-none focus:ring-2 focus:ring-mid focus:border-transparent appearance-none bg-white"
                    >
                        <option value="">Select unit</option>
                        {units.units.map((unit) => (
                            <option key={unit.id} value={unit.id.toString()}>
                                {unit.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3">
                <button
                    className="px-5 py-2.5 border border-gray-200 text-dark rounded-md text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={closeModal}
                >
                    Cancel
                </button>
                <button
                    className="px-5 py-2.5 bg-mid text-white rounded-md text-sm font-medium hover:bg-dark transition-colors cursor-pointer"
                    onClick={createNewIngredient}
                >
                    Add Ingredient
                </button>
            </div>
        </div>
    </div>)
}

export default NewIngredientModal;
