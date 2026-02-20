import { IngredientQuantity } from '../Types';

interface Props {
    ingredients: IngredientQuantity[];
}

function IngredientList({ ingredients }: Props) {
    if (ingredients.length === 0) return null;

    return (
        <ul>
            {ingredients.map((iq) => (
                <li key={String(iq.ingredient.id)}>
                    {iq.quantity} {iq.ingredient.unit.abbreviation} {iq.ingredient.name}
                </li>
            ))}
        </ul>
    );
}

export default IngredientList;
