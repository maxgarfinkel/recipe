// apiHooks.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {useFetchRecipes, useSaveRecipe} from './apiHooks';
import { Recipe } from './Types';
import {deferred} from "./testUtils/deferred.ts";

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true)

describe('useSaveRecipe', () => {
    const mockRecipe: Recipe = {
        id: null,
        name: "Test Recipe",
        method: "Test Method",
        servings: 4,
        ingredientQuantities: []
    };

    const mockSavedRecipe: Recipe = {
        ...mockRecipe,
        id: BigInt(1)
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useSaveRecipe());

        expect(result.current.savedRecipe).toBeUndefined();
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
        expect(typeof result.current.saveRecipe).toBe('function');
    });

    it('should successfully save a recipe', async () => {
        // Mock successful axios post
        mockedAxios.post.mockResolvedValueOnce({
            data: mockSavedRecipe 
        });

        const { result } = renderHook(() => useSaveRecipe());

        await act(async () => {
            await result.current.saveRecipe(mockRecipe);
        });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/recipe/'), 
            mockRecipe
        );
        expect(result.current.savedRecipe).toEqual(mockSavedRecipe);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
    });

    it('should handle save failure', async () => {
        const errorMessage = 'Failed to save recipe';
        // Mock failed axios post
        mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useSaveRecipe());

        await act(async () => {
            await result.current.saveRecipe(mockRecipe);
        });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/recipe/'), 
            mockRecipe
        );
        expect(result.current.savedRecipe).toBeUndefined();
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBeFalsy();
    });

    it('should set loading state while saving', async () => {
        // Mock delayed axios post

        const deferredPost = deferred<{ data: Recipe }>();

        mockedAxios.post.mockImplementationOnce(() =>
            deferredPost.promise
        );

        const { result } = renderHook(() => useSaveRecipe());

        let promise: Promise<void>;

        await act(async () => {
            promise = result.current.saveRecipe(mockRecipe);
        })

        expect(result.current.loading).toBeTruthy();

        await act(async () => {
            deferredPost.resolve({ data: mockRecipe });
            await promise!;
        });

        expect(result.current.loading).toBeFalsy();
    });

    it('should maintain previous savedRecipe state on error', async () => {
        // First save succeeds
        mockedAxios.post.mockResolvedValueOnce({
            data: mockSavedRecipe 
        });

        const { result } = renderHook(() => useSaveRecipe());

        await act(async () => {
            await result.current.saveRecipe(mockRecipe);
        });

        // Second save fails
        mockedAxios.post.mockRejectedValueOnce(new Error('Failed'));

        await act(async () => {
            await result.current.saveRecipe({...mockRecipe, name: "New Name"});
        });

        expect(result.current.savedRecipe).toEqual(mockSavedRecipe);
    });
});

describe('useFetchRecipes', () => {
    const mockRecipes: Recipe[] = [
        {id: BigInt(0), name: "Test Recipe 1", method: "Test Method 1", servings: 4, ingredientQuantities: []},
        {id: BigInt(1), name: "Test Recipe 2", method: "Test Method 2", servings: 4, ingredientQuantities: []}
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useFetchRecipes());
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
        expect(result.current.recipes).toStrictEqual([]);
    })

    it('should fetch recipes on mount', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: mockRecipes });

        const { result } = renderHook(() => useFetchRecipes());

        await act(async () => {
            result.current.fetchRecipes();
        })

        expect(result.current.loading).toBeFalsy();
        expect(result.current.error).toBeNull();
        expect(result.current.recipes).toBe(mockRecipes);
    })

    it('should handle fetch failure', async () => {
        const errorMessage = 'Failed to fetch recipes';
        mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useFetchRecipes());

        await act(async () => {
            result.current.fetchRecipes();
        })

        expect(result.current.loading).toBeFalsy();
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.recipes).toStrictEqual([]);
    })

    it('should set loading state when fetching', async () => {

        const deferredGet = deferred<{ data: Recipe[] }>();

        mockedAxios.get.mockImplementationOnce(() =>
            deferredGet.promise
        );
        const { result } = renderHook(() => useFetchRecipes());

        await act(async () => {
            result.current.fetchRecipes();
        })

        expect(result.current.loading).toBeTruthy();
        expect(result.current.error).toBeNull();
        expect(result.current.recipes).toStrictEqual([]);

        await act(async () => {
            deferredGet.resolve({ data: mockRecipes });
        })

        expect(result.current.loading).toBeFalsy();
        expect(result.current.error).toBeNull();
        expect(result.current.recipes).toStrictEqual(mockRecipes);
    });

    it('should maintain previous recipes state on error', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: mockRecipes });

        const { result } = renderHook(() => useFetchRecipes());

        await act(async () => {
            result.current.fetchRecipes();
        })

        mockedAxios.get.mockRejectedValueOnce(new Error('Failed'));

        await act(async () => {
            result.current.fetchRecipes();
        })

        expect(result.current.error).toBe('Failed');
        expect(result.current.recipes).toBe(mockRecipes);
        expect(result.current.loading).toBeFalsy();

    })
})