import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
    useUpdateRecipe: vi.fn(),
    useFetchRecipe: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks are registered
// ---------------------------------------------------------------------------

import RecipeEditorPage from './RecipeEditorPage';
import { useFetchIngredients, useFetchUnits, useSaveRecipe, useUpdateRecipe, useFetchRecipe } from '../apiHooks';
import { ToastProvider } from '../context/ToastContext';

// ---------------------------------------------------------------------------
// Wrappers
// ---------------------------------------------------------------------------

function CreateWrapper({ children }: { children: ReactNode }) {
    return (
        <MemoryRouter initialEntries={['/new-recipe']}>
            <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
    );
}

function EditWrapper({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            <MemoryRouter initialEntries={['/recipe/1/edit']}>
                <Routes>
                    <Route path="/recipe/:id/edit" element={<>{children}</>} />
                </Routes>
            </MemoryRouter>
        </ToastProvider>
    );
}

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
const mockUpdateRecipe = vi.fn();
const mockSavedRecipe: Recipe = {
    id: BigInt(1),
    name: 'Saved Recipe',
    method: 'Boil water',
    servings: 4,
    ingredientQuantities: [],
};
const mockFetchedRecipe: Recipe = {
    id: BigInt(1),
    name: 'Existing Recipe',
    method: 'Existing method',
    servings: 3,
    ingredientQuantities: [
        {
            id: BigInt(10),
            quantity: 100,
            ingredient: { id: BigInt(1), name: 'flour', unit: { id: BigInt(1), name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 } },
        },
    ],
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
    fetchedRecipe?: Recipe | null;
    fetchLoading?: boolean;
    fetchError?: string | null;
    updatedRecipe?: Recipe | undefined;
    updateError?: string | null;
    updating?: boolean;
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
    fetchedRecipe = null,
    fetchLoading = false,
    fetchError = null,
    updatedRecipe = undefined,
    updateError = null,
    updating = false,
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
    vi.mocked(useFetchRecipe).mockReturnValue({
        recipe: fetchedRecipe,
        loading: fetchLoading,
        error: fetchError,
        fetchRecipe: vi.fn(),
    });
    vi.mocked(useUpdateRecipe).mockReturnValue({
        updatedRecipe,
        error: updateError,
        loading: updating,
        updateRecipe: mockUpdateRecipe,
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
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('shows a loading indicator while units are loading', () => {
            setupHooks({ unitLoading: true, ingredients: [] });
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('shows an error toast when the ingredient fetch fails', () => {
            setupHooks({ ingredientError: 'Network error', ingredients: [] });
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            expect(screen.getByText('Could not load ingredients: Network error')).toBeInTheDocument();
        });

        it('does not render the form before data has loaded', () => {
            setupHooks({ ingredients: [] });
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            expect(screen.queryByLabelText(/recipe name/i)).not.toBeInTheDocument();
        });
    });

    // --- Form rendering -------------------------------------------------------

    describe('form rendering', () => {
        it('renders the recipe name and servings inputs once data has loaded', () => {
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/servings/i)).toBeInTheDocument();
        });

        it('renders the method editor', () => {
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            expect(screen.getByTestId('method-editor')).toBeInTheDocument();
        });

        it('renders the save button', () => {
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            expect(screen.getByRole('button', { name: /save recipe/i })).toBeInTheDocument();
        });

        it('shows "New Recipe" heading in create mode', () => {
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            expect(screen.getByRole('heading', { name: /new recipe/i })).toBeInTheDocument();
        });
    });

    // --- Form interaction -----------------------------------------------------

    describe('form interaction', () => {
        it('reflects typed recipe name in the input', () => {
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            const input = screen.getByLabelText(/recipe name/i);
            fireEvent.change(input, { target: { value: 'Pasta Bake' } });
            expect(input).toHaveValue('Pasta Bake');
        });

        it('reflects typed servings value in the input', () => {
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            const input = screen.getByLabelText(/servings/i);
            fireEvent.change(input, { target: { value: '6' } });
            expect(input).toHaveValue('6');
        });

        it('shows an added ingredient in the list', () => {
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            fireEvent.click(screen.getByTestId('add-ingredient-btn'));
            expect(screen.getByText(/flour/i)).toBeInTheDocument();
        });
    });

    // --- Saving ---------------------------------------------------------------

    describe('saving', () => {
        it('calls saveRecipe with the correct recipe payload', () => {
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
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
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            fireEvent.click(screen.getByTestId('add-ingredient-btn'));
            fireEvent.click(screen.getByRole('button', { name: /save recipe/i }));

            expect(mockSaveRecipe).toHaveBeenCalledWith(
                expect.objectContaining({
                    ingredientQuantities: [mockSelectorIngredientQty],
                })
            );
        });

        it('defaults servings to 0 when the field is left empty', () => {
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            fireEvent.click(screen.getByRole('button', { name: /save recipe/i }));
            expect(mockSaveRecipe).toHaveBeenCalledWith(
                expect.objectContaining({ servings: 0 })
            );
        });

        it('disables the save button and shows "Saving…" while in flight', () => {
            setupHooks({ saving: true });
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            const button = screen.getByRole('button', { name: /saving/i });
            expect(button).toBeDisabled();
        });
    });

    // --- Success toast --------------------------------------------------------

    describe('success toast', () => {
        it('shows a success toast when the recipe is saved', () => {
            setupHooks({ savedRecipe: mockSavedRecipe });
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            expect(screen.getByText('Recipe saved successfully!')).toBeInTheDocument();
        });

        it('resets all form fields after a successful save', async () => {
            setupHooks();
            const { rerender } = render(<RecipeEditorPage />, { wrapper: CreateWrapper });

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
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
            expect(screen.queryByText('Recipe saved successfully!')).not.toBeInTheDocument();
        });

        it('auto-dismisses the success toast after 4 seconds', async () => {
            vi.useFakeTimers();
            setupHooks({ savedRecipe: mockSavedRecipe });
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });

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
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });
            expect(screen.getByText('Could not save recipe: Network Error')).toBeInTheDocument();
        });

        it('preserves form data when the save fails', async () => {
            setupHooks();
            const { rerender } = render(<RecipeEditorPage />, { wrapper: CreateWrapper });

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
            render(<RecipeEditorPage />, { wrapper: CreateWrapper });

            expect(screen.getByText(/Could not save recipe/)).toBeInTheDocument();

            await act(async () => {
                vi.advanceTimersByTime(4000);
            });

            expect(screen.queryByText(/Could not save recipe/)).not.toBeInTheDocument();
            vi.useRealTimers();
        });
    });

    // --- Edit mode ------------------------------------------------------------

    describe('edit mode', () => {
        it('shows "Edit Recipe" heading in edit mode', () => {
            render(<RecipeEditorPage />, { wrapper: EditWrapper });
            expect(screen.getByRole('heading', { name: /edit recipe/i })).toBeInTheDocument();
        });

        it('shows a loading indicator while fetching the recipe', () => {
            setupHooks({ fetchLoading: true, ingredients: [] });
            render(<RecipeEditorPage />, { wrapper: EditWrapper });
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('pre-populates name and servings from the fetched recipe', () => {
            setupHooks({ fetchedRecipe: mockFetchedRecipe });
            render(<RecipeEditorPage />, { wrapper: EditWrapper });
            expect(screen.getByLabelText(/recipe name/i)).toHaveValue('Existing Recipe');
            expect(screen.getByLabelText(/servings/i)).toHaveValue('3');
        });

        it('pre-populates the method from the fetched recipe', () => {
            setupHooks({ fetchedRecipe: mockFetchedRecipe });
            render(<RecipeEditorPage />, { wrapper: EditWrapper });
            expect(screen.getByTestId('method-editor')).toHaveValue('Existing method');
        });

        it('pre-populates the ingredient list from the fetched recipe', () => {
            setupHooks({ fetchedRecipe: mockFetchedRecipe });
            render(<RecipeEditorPage />, { wrapper: EditWrapper });
            expect(screen.getByText(/flour/i)).toBeInTheDocument();
        });

        it('renders "Update Recipe" button in edit mode', () => {
            render(<RecipeEditorPage />, { wrapper: EditWrapper });
            expect(screen.getByRole('button', { name: /update recipe/i })).toBeInTheDocument();
        });

        it('calls updateRecipe (not saveRecipe) when save is clicked in edit mode', () => {
            setupHooks({ fetchedRecipe: mockFetchedRecipe });
            render(<RecipeEditorPage />, { wrapper: EditWrapper });
            fireEvent.click(screen.getByRole('button', { name: /update recipe/i }));
            expect(mockUpdateRecipe).toHaveBeenCalledOnce();
            expect(mockSaveRecipe).not.toHaveBeenCalled();
        });

        it('preserves the recipe ID in the update payload', () => {
            setupHooks({ fetchedRecipe: mockFetchedRecipe });
            render(<RecipeEditorPage />, { wrapper: EditWrapper });
            fireEvent.click(screen.getByRole('button', { name: /update recipe/i }));
            expect(mockUpdateRecipe).toHaveBeenCalledWith(
                expect.objectContaining({ id: mockFetchedRecipe.id })
            );
        });

        it('does not reset the form after a successful update', async () => {
            setupHooks({ fetchedRecipe: mockFetchedRecipe });
            const { rerender } = render(<RecipeEditorPage />, { wrapper: EditWrapper });

            setupHooks({ fetchedRecipe: mockFetchedRecipe, updatedRecipe: mockFetchedRecipe });
            await act(async () => {
                rerender(<RecipeEditorPage />);
            });

            expect(screen.getByLabelText(/recipe name/i)).toHaveValue('Existing Recipe');
        });

        it('shows "Recipe updated successfully!" toast on success', async () => {
            setupHooks({ fetchedRecipe: mockFetchedRecipe });
            const { rerender } = render(<RecipeEditorPage />, { wrapper: EditWrapper });

            setupHooks({ fetchedRecipe: mockFetchedRecipe, updatedRecipe: mockFetchedRecipe });
            await act(async () => {
                rerender(<RecipeEditorPage />);
            });

            expect(screen.getByText('Recipe updated successfully!')).toBeInTheDocument();
        });

        it('shows an error toast when the update fails', async () => {
            setupHooks({ fetchedRecipe: mockFetchedRecipe });
            const { rerender } = render(<RecipeEditorPage />, { wrapper: EditWrapper });

            setupHooks({ fetchedRecipe: mockFetchedRecipe, updateError: 'Server Error' });
            await act(async () => {
                rerender(<RecipeEditorPage />);
            });

            expect(screen.getByText('Could not update recipe: Server Error')).toBeInTheDocument();
        });
    });
});
