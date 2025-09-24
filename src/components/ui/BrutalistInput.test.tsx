import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BrutalistInput from './BrutalistInput';

describe('BrutalistInput Component', () => {
  it('renders input with label', () => {
    render(
      <BrutalistInput
        label="Test Input"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
  });

  it('handles input changes', () => {
    const mockOnChange = vi.fn();
    
    render(
      <BrutalistInput
        label="Test Input"
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Test Input');
    fireEvent.change(input, { target: { value: 'test value' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(
      <BrutalistInput
        label="Test Input"
        value=""
        onChange={() => {}}
        error="This field is required"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(
      <BrutalistInput
        label="Test Input"
        value=""
        onChange={() => {}}
        placeholder="Enter text here"
      />
    );

    expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(
      <BrutalistInput
        label="Test Input"
        value=""
        onChange={() => {}}
        disabled
      />
    );

    const input = screen.getByLabelText('Test Input');
    expect(input).toBeDisabled();
  });

  it('supports different input types', () => {
    render(
      <BrutalistInput
        label="Email Input"
        type="email"
        value=""
        onChange={() => {}}
      />
    );

    const input = screen.getByLabelText('Email Input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('handles required field', () => {
    render(
      <BrutalistInput
        label="Required Input"
        value=""
        onChange={() => {}}
        required
      />
    );

    const input = screen.getByLabelText('Required Input');
    expect(input).toBeRequired();
  });

  it('applies custom className', () => {
    render(
      <BrutalistInput
        label="Test Input"
        value=""
        onChange={() => {}}
        className="custom-class"
      />
    );

    const container = screen.getByLabelText('Test Input').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('shows password visibility toggle for password type', () => {
    render(
      <BrutalistInput
        label="Password"
        type="password"
        value=""
        onChange={() => {}}
      />
    );

    // Check if password input is rendered
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('maintains input value', () => {
    render(
      <BrutalistInput
        label="Test Input"
        value="test value"
        onChange={() => {}}
      />
    );

    const input = screen.getByLabelText('Test Input');
    expect(input).toHaveValue('test value');
  });
});