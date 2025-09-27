import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrutalistInput from './BrutalistInput';

describe('BrutalistInput Component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders input with label', () => {
    render(
      <BrutalistInput
        label="Test Input"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Test Input')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('handles input changes', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    render(
      <BrutalistInput
        label="Test Input"
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'a');

    expect(mockOnChange).toHaveBeenCalled();
    expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
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

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('applies input type correctly', () => {
    render(
      <BrutalistInput
        label="Email Input"
        value=""
        onChange={() => {}}
        type="email"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('handles required attribute', () => {
    render(
      <BrutalistInput
        label="Required Input"
        value=""
        onChange={() => {}}
        required
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('displays current value', () => {
    render(
      <BrutalistInput
        label="Test Input" 
        value="current value"
        onChange={() => {}}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('current value');
  });

  it('applies custom className', () => {
    const { container } = render(
      <BrutalistInput
        label="Test Input"
        value=""
        onChange={() => {}}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
