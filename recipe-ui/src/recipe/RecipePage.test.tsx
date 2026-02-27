import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Recipe } from '../Types';

// ---------------------------------------------------------------------------
// Hoisted values
// ---------------------------------------------------------------------------

const mockNavigate = vi.hoisted(() => vi.fn());

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: '1' }) };
});

vi.mock('../apiHooks', () => ({
    useFetchRecipe: vi.fn(),
    useDeleteRecipe: vi.fn(),
}));

// Prevent MDX editor from blowing up in jsdom
vi.mock('react-markdown', () => ({
    default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

// ---------------------------------------------------------------------------
// Imports after mocks are registered
// ---------------------------------------------------------------------------

import RecipePage from './RecipePage';
import { useFetchRecipe, useDeleteRecipe } from '../apiHooks';
import { ToastProvider } from '../context/ToastContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: ReactNode }) {
    return (
        <MemoryRouter initialEntries={['/recipe/1']}>
            <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
    );
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockRecipe: Recipe = {
    id: BigInt(1),
    name: 'Spaghetti Bolognese',
    method: 'Cook the pasta.',
    servings: 4,
    ingredientQuantities: [
        {
            id: BigInt(10),
            quantity: 200,
            ingredient: {
                id: BigInt(1),
                name: 'pasta',
                unit: { id: BigInt(1), name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 },
            },
        },
    ],
};

const mockDeleteRecipe = vi.fn();

function setupHooks({
    recipe = null,
    loading = false,
    error = null,
    deleted = undefined,
    deleteError = null,
    deleting = false,
}: {
    recipe?: Recipe | null;
    loading?: boolean;
    error?: string | null;
    deleted?: boolean | undefined;
    deleteError?: string | null;
    deleting?: boolean;
} = {}) {
    vi.mocked(useFetchRecipe).mockReturnValue({
        recipe,
        loading,
        error,
        fetchRecipe: vi.fn(),
    });
    vi.mocked(useDeleteRecipe).mockReturnValue({
        deleted,
        error: deleteError,
        loading: deleting,
        deleteRecipe: mockDeleteRecipe,
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RecipePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupHooks();
    });

    afterEach(() => {
        cleanup();
    });

    it('shows a loading indicator while the recipe is loading', () => {
        setupHooks({ loading: true });
        render(<RecipePage />, { wrapper: Wrapper });
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders the recipe name once loaded', () => {
        setupHooks({ recipe: mockRecipe });
        render(<RecipePage />, { wrapper: Wrapper });
        expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument();
    });

    it('renders the servings count once loaded', () => {
        setupHooks({ recipe: mockRecipe });
        render(<RecipePage />, { wrapper: Wrapper });
        expect(screen.getByText(/4 serving/)).toBeInTheDocument();
    });

    it('renders ingredients once loaded', () => {
        setupHooks({ recipe: mockRecipe });
        render(<RecipePage />, { wrapper: Wrapper });
        const item = screen.getByRole('listitem');
        expect(item).toHaveTextContent('pasta');
    });

    it('renders the method once loaded', () => {
        setupHooks({ recipe: mockRecipe });
        render(<RecipePage />, { wrapper: Wrapper });
        expect(screen.getByText('Cook the pasta.')).toBeInTheDocument();
    });

    it('shows a Delete button when the recipe is loaded', () => {
        setupHooks({ recipe: mockRecipe });
        render(<RecipePage />, { wrapper: Wrapper });
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    });

    it('opens the confirmation modal when Delete is clicked', () => {
        setupHooks({ recipe: mockRecipe });
        render(<RecipePage />, { wrapper: Wrapper });
        fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
        expect(screen.getByText('Delete Recipe')).toBeInTheDocument();
    });

    it('shows the recipe name in the modal confirmation copy', () => {
        setupHooks({ recipe: mockRecipe });
        render(<RecipePage />, { wrapper: Wrapper });
        fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
        expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it('closes the modal when Cancel is clicked', () => {
        setupHooks({ recipe: mockRecipe });
        render(<RecipePage />, { wrapper: Wrapper });
        fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(screen.queryByText('Delete Recipe')).not.toBeInTheDocument();
    });

    it('calls deleteRecipe with the numeric recipe id when the modal Delete is confirmed', () => {
        setupHooks({ recipe: mockRecipe });
        render(<RecipePage />, { wrapper: Wrapper });

        // Open the modal
        fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

        // Confirm — there are now two Delete buttons (page + modal); click the modal one
        const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
        fireEvent.click(deleteButtons[deleteButtons.length - 1]);

        expect(mockDeleteRecipe).toHaveBeenCalledWith(1);
    });

    it('navigates home and shows a success toast when deleted becomes true', async () => {
        setupHooks({ recipe: mockRecipe });
        const { rerender } = render(<RecipePage />, { wrapper: Wrapper });

        setupHooks({ recipe: mockRecipe, deleted: true });
        await act(async () => {
            rerender(<RecipePage />);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/');
        expect(screen.getByText('Recipe deleted successfully!')).toBeInTheDocument();
    });

    it('shows an error toast when deleteError is set', async () => {
        setupHooks({ recipe: mockRecipe });
        const { rerender } = render(<RecipePage />, { wrapper: Wrapper });

        setupHooks({ recipe: mockRecipe, deleteError: 'Server Error' });
        await act(async () => {
            rerender(<RecipePage />);
        });

        expect(screen.getByText('Could not delete recipe: Server Error')).toBeInTheDocument();
    });

    it('closes the modal immediately when confirm is clicked', () => {
        setupHooks({ recipe: mockRecipe });
        render(<RecipePage />, { wrapper: Wrapper });

        fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
        expect(screen.getByText('Delete Recipe')).toBeInTheDocument();

        const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
        fireEvent.click(deleteButtons[deleteButtons.length - 1]);

        expect(screen.queryByText('Delete Recipe')).not.toBeInTheDocument();
    });

    it('renders a source attribution link when sourceUrl is present', () => {
        setupHooks({ recipe: { ...mockRecipe, sourceUrl: 'https://example.com/recipe' } });
        render(<RecipePage />, { wrapper: Wrapper });
        const link = screen.getByRole('link', { name: /example\.com\/recipe/ });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://example.com/recipe');
    });

    it('renders no source attribution when sourceUrl is absent', () => {
        setupHooks({ recipe: mockRecipe });
        render(<RecipePage />, { wrapper: Wrapper });
        expect(screen.queryByText(/source:/i)).not.toBeInTheDocument();
    });
});
