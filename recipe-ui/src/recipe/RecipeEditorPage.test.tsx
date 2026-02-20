import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Recipe, Ingredient } from '../Types';
import { Unit } from '../Unit/Unit';
import { Units } from '../Unit/Units';

// ---------------------------------------------------------------------------
// Hoisted values — available inside vi.mock() factories
// ---------------------------------------------------------------------------

const mockSelectorIngredientQty = vi.hoisted(() => ({
    id: null as null,
    quantity: 200,
    ingredient: {
        id: BigInt(1) as bigint,
        name: 'flour',
        unit: { id: BigInt(1) as bigint, name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 },
    },
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@mdxeditor/editor', () => ({
    // Simple textarea that binds to the `markdown` prop so form-reset is testable.
    // ref.current stays null; ref.current?.setMarkdown('') is a no-op, but
    // setMethod('') in the component's useEffect correctly resets the state.
    MDXEditor: ({ markdown, onChange }: { markdown: string; onChange: (v: string) => void }) => (
        <textarea
            data-testid="method-editor"
            value={markdown}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
    toolbarPlugin: () => ({}),
    headingsPlugin: () => ({}),
    listsPlugin: () => ({}),
    linkPlugin: () => ({}),
    markdownShortcutPlugin: () => ({}),
    UndoRedo: () => null,
    Separator: () => null,
    BoldItalicUnderlineToggles: () => null,
    BlockTypeSelect: () => null,
    ListsToggle: () => null,
}));

vi.mock('../Ingredient/IngredientsSelector', () => ({
    default: ({ addIngredient }: { addIngredient: (iq: typeof mockSelectorIngredientQty) => void }) => (
        <button
            data-testid="add-ingredient-btn"
            onClick={() => addIngredient(mockSelectorIngredientQty)}
        >
            Add Test Ingredient
        </button>
    ),
}));

vi.mock('../apiHooks', () => ({
    useFetchIngredients: vi.fn(),
    useFetchUnits: vi.fn(),
    useSaveRecipe: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks are registered
// ---------------------------------------------------------------------------

import RecipeEditorPage from './RecipeEditorPage';
import { useFetchIngredients, useFetchUnits, useSaveRecipe } from '../apiHooks';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockUnit: Unit = { id: BigInt(1), name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 };
const mockIngredient: Ingredient = {
    id: BigInt(1),
    name: 'flour',
    unit: { id: BigInt(1), name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 },
};
const mockUnits = new Units([mockUnit]);
const mockSaveRecipe = vi.fn();
const mockSavedRecipe: Recipe = {
    id: BigInt(1),
    name: 'Saved Recipe',
    method: 'Boil water',
    servings: 4,
    ingredientQuantities: [],
};

// ---------------------------------------------------------------------------
// Hook setup helper
// ---------------------------------------------------------------------------

interface HookOptions {
    ingredients?: Ingredient[];
    units?: Units;
    ingredientLoading?: boolean;
    ingredientError?: string | null;
    unitLoading?: boolean;
    unitError?: string | null;
    savedRecipe?: Recipe | undefined;
    saveError?: string | null;
    saving?: boolean;
}

function setupHooks({
    ingredients = [mockIngredient],
    units = mockUnits,
    ingredientLoading = false,
    ingredientError = null,
    unitLoading = false,
    unitError = null,
    savedRecipe = undefined,
    saveError = null,
    saving = false,
}: HookOptions = {}) {
    vi.mocked(useFetchIngredients).mockReturnValue({
        allIngredients: ingredients,
        ingredientLoading,
        ingredientError,
        fetchIngredients: vi.fn(),
    });
    vi.mocked(useFetchUnits).mockReturnValue({
        units,
        unitLoading,
        unitError,
        fetchUnits: vi.fn(),
    });
    vi.mocked(useSaveRecipe).mockReturnValue({
        savedRecipe,
        error: saveError,
        loading: saving,
        saveRecipe: mockSaveRecipe,
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RecipeEditorPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupHooks();
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    // --- Loading & error states -----------------------------------------------

    describe('loading and error states', () => {
        it('shows a loading indicator while ingredients are loading', () => {
            setupHooks({ ingredientLoading: true, ingredients: [] });
            render(<RecipeEditorPage />);
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('shows a loading indicator while units are loading', () => {
            setupHooks({ unitLoading: true, ingredients: [] });
            render(<RecipeEditorPage />);
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('shows an error message when the ingredient fetch fails', () => {
            setupHooks({ ingredientError: 'Network error', ingredients: [] });
            render(<RecipeEditorPage />);
            expect(screen.getByText('Error')).toBeInTheDocument();
        });

        it('does not render the form before data has loaded', () => {
            setupHooks({ ingredients: [] });
            render(<RecipeEditorPage />);
            expect(screen.queryByLabelText(/recipe name/i)).not.toBeInTheDocument();
        });
    });

    // --- Form rendering -------------------------------------------------------

    describe('form rendering', () => {
        it('renders the recipe name and servings inputs once data has loaded', () => {
            render(<RecipeEditorPage />);
            expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/servings/i)).toBeInTheDocument();
        });

        it('renders the method editor', () => {
            render(<RecipeEditorPage />);
            expect(screen.getByTestId('method-editor')).toBeInTheDocument();
        });

        it('renders the save button', () => {
            render(<RecipeEditorPage />);
            expect(screen.getByRole('button', { name: /save recipe/i })).toBeInTheDocument();
        });
    });

    // --- Form interaction -----------------------------------------------------

    describe('form interaction', () => {
        it('reflects typed recipe name in the input', () => {
            render(<RecipeEditorPage />);
            const input = screen.getByLabelText(/recipe name/i);
            fireEvent.change(input, { target: { value: 'Pasta Bake' } });
            expect(input).toHaveValue('Pasta Bake');
        });

        it('reflects typed servings value in the input', () => {
            render(<RecipeEditorPage />);
            const input = screen.getByLabelText(/servings/i);
            fireEvent.change(input, { target: { value: '6' } });
            expect(input).toHaveValue('6');
        });

        it('shows an added ingredient in the list', () => {
            render(<RecipeEditorPage />);
            fireEvent.click(screen.getByTestId('add-ingredient-btn'));
            expect(screen.getByText(/flour/i)).toBeInTheDocument();
        });
    });

    // --- Saving ---------------------------------------------------------------

    describe('saving', () => {
        it('calls saveRecipe with the correct recipe payload', () => {
            render(<RecipeEditorPage />);
            fireEvent.change(screen.getByLabelText(/recipe name/i), { target: { value: 'Pasta' } });
            fireEvent.change(screen.getByLabelText(/servings/i), { target: { value: '2' } });
            fireEvent.change(screen.getByTestId('method-editor'), { target: { value: 'Boil the pasta' } });
            fireEvent.click(screen.getByRole('button', { name: /save recipe/i }));

            expect(mockSaveRecipe).toHaveBeenCalledWith({
                id: null,
                name: 'Pasta',
                method: 'Boil the pasta',
                servings: 2,
                ingredientQuantities: [],
            });
        });

        it('includes ingredients added via the selector in the save payload', () => {
            render(<RecipeEditorPage />);
            fireEvent.click(screen.getByTestId('add-ingredient-btn'));
            fireEvent.click(screen.getByRole('button', { name: /save recipe/i }));

            expect(mockSaveRecipe).toHaveBeenCalledWith(
                expect.objectContaining({
                    ingredientQuantities: [mockSelectorIngredientQty],
                })
            );
        });

        it('defaults servings to 0 when the field is left empty', () => {
            render(<RecipeEditorPage />);
            fireEvent.click(screen.getByRole('button', { name: /save recipe/i }));
            expect(mockSaveRecipe).toHaveBeenCalledWith(
                expect.objectContaining({ servings: 0 })
            );
        });

        it('disables the save button and shows "Saving…" while in flight', () => {
            setupHooks({ saving: true });
            render(<RecipeEditorPage />);
            const button = screen.getByRole('button', { name: /saving/i });
            expect(button).toBeDisabled();
        });
    });

    // --- Success toast --------------------------------------------------------

    describe('success toast', () => {
        it('shows a success toast when the recipe is saved', () => {
            setupHooks({ savedRecipe: mockSavedRecipe });
            render(<RecipeEditorPage />);
            expect(screen.getByText('Recipe saved successfully!')).toBeInTheDocument();
        });

        it('resets all form fields after a successful save', async () => {
            setupHooks();
            const { rerender } = render(<RecipeEditorPage />);

            fireEvent.change(screen.getByLabelText(/recipe name/i), { target: { value: 'My Recipe' } });
            fireEvent.change(screen.getByLabelText(/servings/i), { target: { value: '4' } });
            fireEvent.change(screen.getByTestId('method-editor'), { target: { value: 'Some steps' } });

            // Simulate the hook returning a savedRecipe on the next render cycle
            setupHooks({ savedRecipe: mockSavedRecipe });
            await act(async () => {
                rerender(<RecipeEditorPage />);
            });

            expect(screen.getByLabelText(/recipe name/i)).toHaveValue('');
            expect(screen.getByLabelText(/servings/i)).toHaveValue('');
            expect(screen.getByTestId('method-editor')).toHaveValue('');
        });

        it('dismisses the toast when the close button is clicked', () => {
            setupHooks({ savedRecipe: mockSavedRecipe });
            render(<RecipeEditorPage />);
            fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
            expect(screen.queryByText('Recipe saved successfully!')).not.toBeInTheDocument();
        });

        it('auto-dismisses the success toast after 4 seconds', async () => {
            vi.useFakeTimers();
            setupHooks({ savedRecipe: mockSavedRecipe });
            render(<RecipeEditorPage />);

            expect(screen.getByText('Recipe saved successfully!')).toBeInTheDocument();

            await act(async () => {
                vi.advanceTimersByTime(4000);
            });

            expect(screen.queryByText('Recipe saved successfully!')).not.toBeInTheDocument();
            vi.useRealTimers();
        });
    });

    // --- Error toast ----------------------------------------------------------

    describe('error toast', () => {
        it('shows an error toast with the failure message', () => {
            setupHooks({ saveError: 'Network Error' });
            render(<RecipeEditorPage />);
            expect(screen.getByText('Could not save recipe: Network Error')).toBeInTheDocument();
        });

        it('preserves form data when the save fails', async () => {
            setupHooks();
            const { rerender } = render(<RecipeEditorPage />);

            fireEvent.change(screen.getByLabelText(/recipe name/i), { target: { value: 'Cheesecake' } });

            setupHooks({ saveError: 'Network Error' });
            await act(async () => {
                rerender(<RecipeEditorPage />);
            });

            expect(screen.getByLabelText(/recipe name/i)).toHaveValue('Cheesecake');
            expect(screen.getByText(/Could not save recipe/)).toBeInTheDocument();
        });

        it('auto-dismisses the error toast after 4 seconds', async () => {
            vi.useFakeTimers();
            setupHooks({ saveError: 'Network Error' });
            render(<RecipeEditorPage />);

            expect(screen.getByText(/Could not save recipe/)).toBeInTheDocument();

            await act(async () => {
                vi.advanceTimersByTime(4000);
            });

            expect(screen.queryByText(/Could not save recipe/)).not.toBeInTheDocument();
            vi.useRealTimers();
        });
    });
});
