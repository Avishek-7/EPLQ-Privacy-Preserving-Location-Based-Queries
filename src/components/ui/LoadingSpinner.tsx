import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
    size = 'md', 
    className = '' 
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    return (
        <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
            <div className="w-full h-full border-2 border-black border-t-transparent rounded-full"></div>
        </div>
    );
};

interface LoadingButtonProps {
    children: React.ReactNode;
    isLoading?: boolean;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
    children,
    isLoading = false,
    onClick,
    className = '',
    disabled = false,
    type = 'button'
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`relative ${className} ${(disabled || isLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                </div>
            )}
            <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                {children}
            </span>
        </button>
    );
};

interface LoadingCardProps {
    isLoading?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
    isLoading = false,
    children,
    className = ''
}) => {
    if (isLoading) {
        return (
            <div className={`bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-300 rounded-lg mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {children}
        </div>
    );
};