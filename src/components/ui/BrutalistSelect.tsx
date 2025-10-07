import React from 'react';
import styled from 'styled-components';

interface BrutalistSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

const BrutalistSelect: React.FC<BrutalistSelectProps> = ({ 
  label, 
  error, 
  children,
  className = '', 
  ...props 
}) => {
  return (
    <StyledWrapper className={className}>
      {label && (
        <label className="brutalist-label">
          {label}
        </label>
      )}
      <select className="brutalist-select" {...props}>
        {children}
      </select>
      {error && (
        <div className="brutalist-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .brutalist-label {
    display: block;
    text-transform: uppercase;
    font-weight: 900;
    font-size: 0.875rem;
    color: #000;
    margin-bottom: 0.75rem;
    letter-spacing: 0.05em;
    font-family: inherit;
  }

  .brutalist-select {
    width: 100%;
    padding: 0.875rem 1rem;
    font-size: 1rem;
    font-weight: 500;
    border: 2px solid #000;
    border-radius: 0.5rem;
    box-shadow: 2.5px 3px 0 #000;
    outline: none;
    transition: all 0.2s ease-in-out;
    background: #fff;
    color: #000;
    font-family: inherit;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.75rem center;
    background-repeat: no-repeat;
    background-size: 1.5rem 1.5rem;
    padding-right: 3rem;
    
    &:focus {
      box-shadow: 5.5px 7px 0 #000;
      border-color: #000;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    option {
      background: #fff;
      color: #000;
      font-weight: 500;
      padding: 0.5rem;
    }
  }

  .brutalist-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fef2f2;
    border: 2px solid #dc2626;
    border-radius: 0.75rem;
    color: #991b1b;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 3px 3px 0 rgba(220, 38, 38, 1);
  }
`;

export default BrutalistSelect;
