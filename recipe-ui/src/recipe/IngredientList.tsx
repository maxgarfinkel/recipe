import { useState } from 'react';
import { IngredientQuantity } from '../Types';
import { Units } from '../Unit/Units';

interface Props {
    ingredients: IngredientQuantity[];
    onRemove?: (index: number) => void;
    onUpdate?: (index: number, updated: IngredientQuantity) => void;
    units?: Units;
}

function IngredientList({ ingredients, onRemove, onUpdate, units }: Props) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editQty, setEditQty] = useState('');
    const [editUnitId, setEditUnitId] = useState('');

    const startEdit = (index: number, iq: IngredientQuantity) => {
        setEditingIndex(index);
        setEditQty(String(iq.quantity));
        setEditUnitId(iq.unit.id.toString());
    };

    const saveEdit = (iq: IngredientQuantity) => {
        if (editingIndex === null || !units || !onUpdate) return;
        onUpdate(editingIndex, { ...iq, quantity: Number(editQty), unit: units.getUnit(editUnitId) });
        setEditingIndex(null);
    };

    const cancelEdit = () => setEditingIndex(null);

    if (ingredients.length === 0) return null;

    return (
        <ul className="flex flex-col gap-1 mb-4">
            {ingredients.map((iq, index) => (
                <li key={index} className="flex items-center gap-2">
                    {editingIndex === index ? (
                        <>
                            <span className="flex-1 text-dark">{iq.ingredient.name}</span>
                            <input
                                value={editQty}
                                onChange={(e) => setEditQty(e.target.value)}
                                className="w-16 border border-gray-200 rounded px-2 py-1 text-dark text-right focus:outline-none focus:ring-2 focus:ring-mid"
                                autoFocus
                            />
                            {units && (
                                <select
                                    value={editUnitId}
                                    onChange={(e) => setEditUnitId(e.target.value)}
                                    className="border border-gray-200 rounded px-2 py-1 text-dark focus:outline-none focus:ring-2 focus:ring-mid bg-white"
                                >
                                    {units.units.map(u => (
                                        <option key={u.id.toString()} value={u.id.toString()}>
                                            {u.abbreviation || u.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <button
                                onClick={() => saveEdit(iq)}
                                aria-label="Save"
                                className="text-mid hover:text-dark transition-colors cursor-pointer font-medium text-sm"
                            >
                                ✓
                            </button>
                            <button
                                onClick={cancelEdit}
                                aria-label="Cancel"
                                className="text-gray-400 hover:text-dark transition-colors cursor-pointer leading-none"
                            >
                                &times;
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="flex-1 text-dark">{iq.quantity} {iq.unit.abbreviation} {iq.ingredient.name}</span>
                            {onUpdate && units && (
                                <button
                                    onClick={() => startEdit(index, iq)}
                                    aria-label={`Edit ${iq.ingredient.name}`}
                                    className="text-gray-400 hover:text-dark transition-colors cursor-pointer text-sm"
                                >
                                    ✎
                                </button>
                            )}
                            {onRemove && (
                                <button
                                    onClick={() => onRemove(index)}
                                    aria-label={`Remove ${iq.ingredient.name}`}
                                    className="text-gray-400 hover:text-dark transition-colors cursor-pointer leading-none"
                                >
                                    &times;
                                </button>
                            )}
                        </>
                    )}
                </li>
            ))}
        </ul>
    );
}

export default IngredientList;
