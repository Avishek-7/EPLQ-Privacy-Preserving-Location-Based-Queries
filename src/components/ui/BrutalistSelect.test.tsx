import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BrutalistSelect from './BrutalistSelect';

describe('BrutalistSelect Component', () => {
  it('renders select with children', () => {
    render(
      <BrutalistSelect label="Test Select">
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </BrutalistSelect>
    );

    expect(screen.getByText('Test Select')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles option selection', () => {
    const mockOnChange = vi.fn();
    
    render(
      <BrutalistSelect
        label="Test Select"
        onChange={mockOnChange}
      >
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </BrutalistSelect>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'option2' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('displays error state', () => {
    render(
      <BrutalistSelect
        label="Test Select"
        error="This field is required"
      >
        <option value="">Select option</option>
        <option value="option1">Option 1</option>
      </BrutalistSelect>
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(
      <BrutalistSelect
        label="Test Select"
        disabled
      >
        <option value="option1">Option 1</option>
      </BrutalistSelect>
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('applies custom className', () => {
    render(
      <BrutalistSelect
        label="Test Select"
        className="custom-class"
      >
        <option value="option1">Option 1</option>
      </BrutalistSelect>
    );

    const container = screen.getByRole('combobox').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('renders all option children', () => {
    render(
      <BrutalistSelect label="Test Select">
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </BrutalistSelect>
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('handles required field validation', () => {
    render(
      <BrutalistSelect
        label="Test Select"
        required
      >
        <option value="">Select option</option>
        <option value="option1">Option 1</option>
      </BrutalistSelect>
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeRequired();
  });

  it('renders without label', () => {
    render(
      <BrutalistSelect>
        <option value="option1">Option 1</option>
      </BrutalistSelect>
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});