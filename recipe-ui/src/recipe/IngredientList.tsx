import { IngredientQuantity } from '../Types';

interface Props {
    ingredients: IngredientQuantity[];
    onRemove?: (index: number) => void;
}

function IngredientList({ ingredients, onRemove }: Props) {
    if (ingredients.length === 0) return null;

    return (
        <ul>
            {ingredients.map((iq, index) => (
                <li key={index} className="flex items-center justify-between gap-2">
                    <span>{iq.quantity} {iq.unit.abbreviation} {iq.ingredient.name}</span>
                    {onRemove && (
                        <button
                            onClick={() => onRemove(index)}
                            aria-label={`Remove ${iq.ingredient.name}`}
                            className="text-gray-400 hover:text-dark transition-colors cursor-pointer leading-none"
                        >
                            &times;
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}

export default IngredientList;
