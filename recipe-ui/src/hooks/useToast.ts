import { useCallback, useEffect, useReducer } from 'react';

type Toast = { message: string; type: 'success' | 'error' } | null;
type ToastAction =
    | { type: 'show'; message: string; toastType: 'success' | 'error' }
    | { type: 'dismiss' };

function toastReducer(_: Toast, action: ToastAction): Toast {
    switch (action.type) {
        case 'show': return { message: action.message, type: action.toastType };
        case 'dismiss': return null;
    }
}

export function useToast(durationMs = 4000) {
    const [toast, dispatch] = useReducer(toastReducer, null);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => dispatch({ type: 'dismiss' }), durationMs);
        return () => clearTimeout(timer);
    }, [toast, durationMs]);

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        dispatch({ type: 'show', message, toastType: type });
    }, []);

    const dismissToast = useCallback(() => {
        dispatch({ type: 'dismiss' });
    }, []);

    return { toast, showToast, dismissToast };
}
