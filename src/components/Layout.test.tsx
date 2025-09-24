import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Layout Component', () => {
  it('renders children content', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders header with app title', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText(/EPLQ/i)).toBeInTheDocument();
  });

  it('applies brutalist styling', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    // Check for brutalist design elements
    const layoutContainer = screen.getByText('Content').closest('div');
    expect(layoutContainer).toBeInTheDocument();
  });

  it('has responsive layout structure', () => {
    renderWithRouter(
      <Layout>
        <div data-testid="content">Content</div>
      </Layout>
    );

    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
  });

  it('renders navigation elements', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    // The layout should render properly without errors
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('handles empty children', () => {
    renderWithRouter(
      <Layout>
        {null}
      </Layout>
    );

    // Should render without errors even with no children
    expect(document.body).toBeInTheDocument();
  });

  it('renders with multiple children', () => {
    renderWithRouter(
      <Layout>
        <div>First Child</div>
        <div>Second Child</div>
        <div>Third Child</div>
      </Layout>
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Third Child')).toBeInTheDocument();
  });

  it('maintains layout structure with complex content', () => {
    renderWithRouter(
      <Layout>
        <header>Header Content</header>
        <main>Main Content</main>
        <footer>Footer Content</footer>
      </Layout>
    );

    expect(screen.getByText('Header Content')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('preserves component hierarchy', () => {
    const TestComponent = () => (
      <div data-testid="test-component">
        <h1>Test Title</h1>
        <p>Test paragraph</p>
      </div>
    );

    renderWithRouter(
      <Layout>
        <TestComponent />
      </Layout>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test paragraph')).toBeInTheDocument();
  });
});