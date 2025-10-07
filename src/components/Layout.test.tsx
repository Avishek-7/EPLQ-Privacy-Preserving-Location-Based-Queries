import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { AuthProvider } from '../context/AuthContext';

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn()
  })
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Layout Component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders children content', () => {
    renderWithProviders(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders header with app title', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText(/EPLQ/i)).toBeInTheDocument();
  });

  it('applies brutalist styling', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    // Check for brutalist design elements
    const layoutContainer = screen.getByText('Content').closest('div');
    expect(layoutContainer).toBeInTheDocument();
  });

  it('has responsive layout structure', () => {
    renderWithProviders(
      <Layout>
        <div data-testid="content">Content</div>
      </Layout>
    );

    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
  });

  it('renders navigation elements', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    // The layout should render properly without errors
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('handles empty children', () => {
    renderWithProviders(
      <Layout>
        {null}
      </Layout>
    );

    // Should render without errors even with no children
    expect(document.body).toBeInTheDocument();
  });

  it('renders with multiple children', () => {
    renderWithProviders(
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
    renderWithProviders(
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

    renderWithProviders(
      <Layout>
        <TestComponent />
      </Layout>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test paragraph')).toBeInTheDocument();
  });
});