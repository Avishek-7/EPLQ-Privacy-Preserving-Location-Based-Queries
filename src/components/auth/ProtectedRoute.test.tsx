import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthContext, type EPLQAuthContextType } from '../../context/AuthContext';

// Mock Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>
  };
});

const mockAuthContextValue: EPLQAuthContextType = {
    user: null,
    userProfile: null,
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    updateUserProfile: vi.fn(),
    requestLocationAccess: vi.fn(),
    addQueryToHistory: vi.fn().mockResolvedValue(undefined),
    loading: false,
};

const MockAuthProvider = ({ 
  children, 
  value = mockAuthContextValue 
}: { 
  children: React.ReactNode;
  value?: EPLQAuthContextType;
}) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute Component', () => {
  it('renders children when user is authenticated', () => {
    const authenticatedUser = {
      ...mockAuthContextValue,
      user: { uid: '123', email: 'test@example.com' } as any,
      userProfile: {
        uid: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user' as const,
        privacyLevel: 'medium' as const,
        locationDataPermission: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    render(
      <MemoryRouter>
        <MockAuthProvider value={authenticatedUser}>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MockAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    const unauthenticatedUser = {
      ...mockAuthContextValue,
      user: null,
      userProfile: null
    };

    render(
      <MemoryRouter>
        <MockAuthProvider value={unauthenticatedUser}>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MockAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('shows loading state when auth is loading', () => {
    const loadingAuthState = {
      ...mockAuthContextValue,
      loading: true
    };

    render(
      <MemoryRouter>
        <MockAuthProvider value={loadingAuthState}>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MockAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to login when user profile is missing', () => {
    const userWithoutProfile = {
      ...mockAuthContextValue,
      user: { uid: '123', email: 'test@example.com' } as any,
      userProfile: null
    };

    render(
      <MemoryRouter>
        <MockAuthProvider value={userWithoutProfile}>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MockAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login');
  });

  it('restricts access based on admin requirement', () => {
    const userRole = {
      ...mockAuthContextValue,
      user: { uid: '123', email: 'user@example.com' } as any,
      userProfile: {
        uid: '123',
        email: 'user@example.com',
        displayName: 'Regular User',
        role: 'user' as const,
        privacyLevel: 'medium' as const,
        locationDataPermission: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    render(
      <MemoryRouter>
        <MockAuthProvider value={userRole}>
          <ProtectedRoute requireAdmin={true}>
            <TestComponent />
          </ProtectedRoute>
        </MockAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('allows access when user has admin role', () => {
    const adminUser = {
      ...mockAuthContextValue,
      user: { uid: '123', email: 'admin@example.com' } as any,
      userProfile: {
        uid: '123',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: 'admin' as const,
        privacyLevel: 'medium' as const,
        locationDataPermission: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    render(
      <MemoryRouter>
        <MockAuthProvider value={adminUser}>
          <ProtectedRoute requireAdmin={true}>
            <TestComponent />
          </ProtectedRoute>
        </MockAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('allows regular user access when admin not required', () => {
    const regularUser = {
      ...mockAuthContextValue,
      user: { uid: '123', email: 'user@example.com' } as any,
      userProfile: {
        uid: '123',
        email: 'user@example.com',
        displayName: 'Regular User',
        role: 'user' as const,
        privacyLevel: 'medium' as const,
        locationDataPermission: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    render(
      <MemoryRouter>
        <MockAuthProvider value={regularUser}>
          <ProtectedRoute requireAdmin={false}>
            <TestComponent />
          </ProtectedRoute>
        </MockAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders multiple children when authenticated', () => {
    const authenticatedUser = {
      ...mockAuthContextValue,
      user: { uid: '123', email: 'test@example.com' } as any,
      userProfile: {
        uid: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user' as const,
        privacyLevel: 'medium' as const,
        locationDataPermission: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    render(
      <MemoryRouter>
        <MockAuthProvider value={authenticatedUser}>
          <ProtectedRoute>
            <div data-testid="child-1">Child 1</div>
            <div data-testid="child-2">Child 2</div>
          </ProtectedRoute>
        </MockAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('handles auth context not available', () => {
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Should redirect when no auth context is available
    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login');
  });
});