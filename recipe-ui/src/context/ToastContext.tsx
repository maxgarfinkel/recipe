import { createContext, ReactNode, useCallback, useContext, useEffect, useReducer } from 'react';

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

interface ToastContextValue {
    showToast: (message: string, type: 'success' | 'error') => void;
    dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, dispatch] = useReducer(toastReducer, null);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => dispatch({ type: 'dismiss' }), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        dispatch({ type: 'show', message, toastType: type });
    }, []);

    const dismissToast = useCallback(() => {
        dispatch({ type: 'dismiss' });
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, dismissToast }}>
            {children}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-4 px-5 py-4 rounded-xl shadow-xl text-white text-sm font-medium max-w-sm
                    ${toast.type === 'success' ? 'bg-mid' : 'bg-red-600'}`}>
                    <span className="flex-1">{toast.message}</span>
                    <button
                        aria-label="Dismiss"
                        onClick={dismissToast}
                        className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer text-lg leading-none"
                    >
                        &times;
                    </button>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}
