import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { RecipeImportDraft } from '../../Types';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../../apiHooks', () => ({
    useImportRecipe: vi.fn(),
}));

vi.mock('./ImportPreviewForm', () => ({
    default: ({ draft }: { draft: RecipeImportDraft }) => (
        <div data-testid="import-preview-form">ImportPreviewForm: {draft.name}</div>
    ),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import ImportRecipePage from './ImportRecipePage';
import { useImportRecipe } from '../../apiHooks';
import { ToastProvider } from '../../context/ToastContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: ReactNode }) {
    return (
        <MemoryRouter>
            <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
    );
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const mockDraft: RecipeImportDraft = {
    name: 'Chocolate Cake',
    servings: 8,
    method: 'Mix and bake.',
    sourceUrl: 'https://example.com/recipe',
    extractionSource: 'SCHEMA_ORG',
    ingredientLines: [],
};

const mockImportRecipe = vi.fn();

function setupHook({
    importDraft = undefined,
    loading = false,
    error = null,
}: {
    importDraft?: RecipeImportDraft | undefined;
    loading?: boolean;
    error?: string | null;
} = {}) {
    vi.mocked(useImportRecipe).mockReturnValue({
        importDraft,
        loading,
        error,
        importRecipe: mockImportRecipe,
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ImportRecipePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupHook();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders URL input and submit button', () => {
        render(<ImportRecipePage />, { wrapper: Wrapper });

        expect(screen.getByLabelText(/recipe url/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /import recipe/i })).toBeInTheDocument();
    });

    it('calls importRecipe with the typed URL on submit', () => {
        render(<ImportRecipePage />, { wrapper: Wrapper });

        fireEvent.change(screen.getByLabelText(/recipe url/i), {
            target: { value: 'https://example.com/recipe' },
        });
        fireEvent.click(screen.getByRole('button', { name: /import recipe/i }));

        expect(mockImportRecipe).toHaveBeenCalledWith('https://example.com/recipe');
    });

    it('disables button while loading', () => {
        setupHook({ loading: true });
        render(<ImportRecipePage />, { wrapper: Wrapper });

        expect(screen.getByRole('button', { name: /importing/i })).toBeDisabled();
    });

    it('shows error message when error is set', () => {
        setupHook({ error: 'Something went wrong' });
        render(<ImportRecipePage />, { wrapper: Wrapper });

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to import recipe/i)).toBeInTheDocument();
    });

    it('renders ImportPreviewForm when importDraft is available', () => {
        setupHook({ importDraft: mockDraft });
        render(<ImportRecipePage />, { wrapper: Wrapper });

        expect(screen.getByTestId('import-preview-form')).toBeInTheDocument();
        expect(screen.getByText(/Chocolate Cake/)).toBeInTheDocument();
        expect(screen.queryByLabelText(/recipe url/i)).not.toBeInTheDocument();
    });
});
