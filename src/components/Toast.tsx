import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { ...toast, id };
        
        setToasts(prev => [...prev, newToast]);

        // Auto remove after duration
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, toast.duration || 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ 
    toasts, 
    removeToast 
}) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-3">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ 
    toast, 
    onRemove 
}) => {
    const getToastStyles = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return 'bg-emerald-50 border-emerald-500 text-emerald-800';
            case 'error':
                return 'bg-red-50 border-red-500 text-red-800';
            case 'warning':
                return 'bg-amber-50 border-amber-500 text-amber-800';
            case 'info':
            default:
                return 'bg-blue-50 border-blue-500 text-blue-800';
        }
    };

    const getIcon = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
            default:
                return 'ℹ️';
        }
    };

    return (
        <div className={`${getToastStyles(toast.type)} max-w-sm w-full rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 animate-[slideIn_0.3s_ease-out]`}>
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3 flex-1">
                    <span className="text-xl">{getIcon(toast.type)}</span>
                    <div className="flex-1">
                        <h4 className="font-black text-sm uppercase tracking-wide">{toast.title}</h4>
                        {toast.message && (
                            <p className="text-sm mt-1">{toast.message}</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => onRemove(toast.id)}
                    className="text-gray-500 hover:text-gray-700 font-bold text-lg leading-none ml-2"
                >
                    ×
                </button>
            </div>
        </div>
    );
};