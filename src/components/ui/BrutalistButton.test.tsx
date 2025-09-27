import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import BrutalistButton from './BrutalistButton'

describe('BrutalistButton', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  it('should render with default props', () => {
    render(<BrutalistButton>Click me</BrutalistButton>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('brutalist-button', 'brutalist-button--primary', 'brutalist-button--md')
  })

  it('should render with primary variant', () => {
    render(
      <BrutalistButton variant="primary">Primary Button</BrutalistButton>
    )
    
    const button = screen.getByRole('button', { name: 'Primary Button' })
    expect(button).toHaveClass('brutalist-button--primary')
  })

  it('should render with secondary variant', () => {
    render(
      <BrutalistButton variant="secondary">Secondary Button</BrutalistButton>
    )
    
    const button = screen.getByRole('button', { name: 'Secondary Button' })
    expect(button).toHaveClass('brutalist-button--secondary')
  })

  it('should render with danger variant', () => {
    render(
      <BrutalistButton variant="danger">Delete Button</BrutalistButton>
    )
    
    const button = screen.getByRole('button', { name: 'Delete Button' })
    expect(button).toHaveClass('brutalist-button--danger')
  })

  it('should render with primary variant by default', () => {
    render(
      <BrutalistButton>Default Button</BrutalistButton>
    )
    
    const button = screen.getByRole('button', { name: 'Default Button' })
    expect(button).toHaveClass('brutalist-button--primary')
  })

  it('should render in different sizes', () => {
    const { rerender } = render(
      <BrutalistButton size="sm">Small</BrutalistButton>
    )
    expect(screen.getByRole('button')).toHaveClass('brutalist-button--sm')

    expect(screen.getByRole('button')).toHaveClass('brutalist-button--sm')

    rerender(<BrutalistButton size="md">Medium</BrutalistButton>)
    expect(screen.getByRole('button')).toHaveClass('brutalist-button--md')

    rerender(<BrutalistButton size="lg">Large</BrutalistButton>)
    expect(screen.getByRole('button')).toHaveClass('brutalist-button--lg')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<BrutalistButton disabled>Disabled Button</BrutalistButton>)
    
    const button = screen.getByRole('button', { name: 'Disabled Button' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('brutalist-button')
    expect(button).toBeDisabled()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<BrutalistButton onClick={handleClick}>Clickable</BrutalistButton>)
    
    const button = screen.getByRole('button', { name: 'Clickable' })
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should not handle click when disabled', () => {
    const handleClick = vi.fn()
    render(
      <BrutalistButton onClick={handleClick} disabled>
        Disabled
      </BrutalistButton>
    )
    
    const button = screen.getByRole('button', { name: 'Disabled' })
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should forward additional props', () => {
    render(
      <BrutalistButton data-testid="custom-button" type="submit">
        Submit
      </BrutalistButton>
    )
    
    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('should apply custom className alongside default classes', () => {
    render(
      <BrutalistButton className="custom-class">Custom</BrutalistButton>
    )
    
    const button = screen.getByRole('button', { name: 'Custom' })
    expect(button.closest('div')).toHaveClass('custom-class')
    expect(button).toHaveClass('brutalist-button')
  })

  it('should render button with custom attributes', () => {
    render(
      <BrutalistButton aria-label="Custom aria label">
        Custom Button
      </BrutalistButton>
    )
    
    const button = screen.getByRole('button', { name: 'Custom aria label' })
    expect(button).toBeInTheDocument()
  })
})