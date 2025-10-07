import React from 'react';
import styled from 'styled-components';

interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const BrutalistButton: React.FC<BrutalistButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  children,
  className = '', 
  ...props 
}) => {
  return (
    <StyledWrapper className={className}>
      <button 
        className={`brutalist-button brutalist-button--${variant} brutalist-button--${size}`} 
        {...props}
      >
        {children}
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .brutalist-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 2px solid #000;
    border-radius: 0.5rem;
    outline: none;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
    font-family: inherit;
    
    &:hover:not(:disabled) {
      transform: translate(-2px, -2px);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }
  }

  /* Variants */
  .brutalist-button--primary {
    background: #34d399;
    color: #000;
    box-shadow: 4px 4px 0 #000;
    
    &:hover:not(:disabled) {
      background: #10b981;
      box-shadow: 6px 6px 0 #000;
    }
  }

  .brutalist-button--secondary {
    background: #e5e7eb;
    color: #000;
    box-shadow: 4px 4px 0 #000;
    
    &:hover:not(:disabled) {
      background: #d1d5db;
      box-shadow: 6px 6px 0 #000;
    }
  }

  .brutalist-button--danger {
    background: #f87171;
    color: #000;
    box-shadow: 4px 4px 0 #000;
    
    &:hover:not(:disabled) {
      background: #ef4444;
      box-shadow: 6px 6px 0 #000;
    }
  }

  /* Sizes */
  .brutalist-button--sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .brutalist-button--md {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  .brutalist-button--lg {
    padding: 1rem 2rem;
    font-size: 1.125rem;
  }
`;

export default BrutalistButton;
