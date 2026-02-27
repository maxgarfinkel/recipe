import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useImportRecipe } from '../../apiHooks';
import { RecipeImportDraft } from '../../Types';
import { deferred } from '../../testUtils/deferred';

vi.mock('../../api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    }
}));

import api from '../../api';
const mockedApi = vi.mocked(api, true);

const mockDraft: RecipeImportDraft = {
    name: 'Chocolate Cake',
    servings: 8,
    method: 'Mix and bake.',
    sourceUrl: 'https://example.com/recipe',
    extractionSource: 'SCHEMA_ORG',
    ingredientLines: [],
};

describe('useImportRecipe', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with default values', () => {
        const { result } = renderHook(() => useImportRecipe());

        expect(result.current.importDraft).toBeUndefined();
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
        expect(typeof result.current.importRecipe).toBe('function');
    });

    it('sets loading state while importing', async () => {
        const deferredPost = deferred<{ data: RecipeImportDraft }>();
        mockedApi.post.mockImplementationOnce(() => deferredPost.promise);

        const { result } = renderHook(() => useImportRecipe());

        let promise: Promise<void>;

        await act(async () => {
            promise = result.current.importRecipe('https://example.com');
        });

        expect(result.current.loading).toBeTruthy();

        await act(async () => {
            deferredPost.resolve({ data: mockDraft });
            await promise!;
        });

        expect(result.current.loading).toBeFalsy();
    });

    it('populates importDraft on success', async () => {
        mockedApi.post.mockResolvedValueOnce({ data: mockDraft });

        const { result } = renderHook(() => useImportRecipe());

        await act(async () => {
            await result.current.importRecipe('https://example.com');
        });

        expect(api.post).toHaveBeenCalledWith('recipe/import/preview', { url: 'https://example.com' });
        expect(result.current.importDraft).toEqual(mockDraft);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
    });

    it('sets error on failure', async () => {
        const errorMessage = 'Failed to import';
        mockedApi.post.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useImportRecipe());

        await act(async () => {
            await result.current.importRecipe('https://example.com');
        });

        expect(result.current.importDraft).toBeUndefined();
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBeFalsy();
    });
});
