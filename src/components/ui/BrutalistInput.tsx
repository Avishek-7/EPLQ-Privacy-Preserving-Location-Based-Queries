import React from 'react';
import styled from 'styled-components';

interface BrutalistInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const BrutalistInput: React.FC<BrutalistInputProps> = ({ 
  label, 
  error, 
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
      <input className="brutalist-input" {...props} />
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

  .brutalist-input {
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
    
    &::placeholder {
      color: #6b7280;
      font-weight: 500;
    }
    
    &:focus {
      box-shadow: 5.5px 7px 0 #000;
      border-color: #000;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

export default BrutalistInput;
