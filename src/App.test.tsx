import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock all the components and context
vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  }
}));

vi.mock('./pages/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('./pages/Register', () => ({
  RegisterPage: () => <div data-testid="register-page">Register Page</div>
}));

vi.mock('./components/user/UserDashboard', () => ({
  UserDashboard: () => <div data-testid="user-dashboard">User Dashboard</div>
}));

vi.mock('./components/admin/AdminDashboard', () => ({
  default: () => <div data-testid="admin-dashboard">Admin Dashboard</div>
}));

vi.mock('./components/user/POISearch', () => ({
  POISearch: () => <div data-testid="poi-search">POI Search</div>
}));

vi.mock('./components/admin/DataUpload', () => ({
  DataUpload: () => <div data-testid="data-upload">Data Upload</div>
}));

vi.mock('./components/admin/UserManagement', () => ({
  default: () => <div data-testid="user-management">User Management</div>
}));

vi.mock('./components/admin/SystemStats', () => ({
  default: () => <div data-testid="system-stats">System Stats</div>
}));

vi.mock('./components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('renders login page on /login route', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders register page on /register route', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('register-page')).toBeInTheDocument();
  });

  it('renders dashboard route with protected route wrapper', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
  });

  it('renders admin dashboard with admin protection', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
  });

  it('renders POI search page', () => {
    render(
      <MemoryRouter initialEntries={['/search']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('poi-search')).toBeInTheDocument();
  });

  it('renders data upload page for admin', () => {
    render(
      <MemoryRouter initialEntries={['/admin/upload']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('data-upload')).toBeInTheDocument();
  });

  it('renders user management page for admin', () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('user-management')).toBeInTheDocument();
  });

  it('renders system stats page for admin', () => {
    render(
      <MemoryRouter initialEntries={['/admin/stats']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('system-stats')).toBeInTheDocument();
  });

  it('handles unknown routes gracefully', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <App />
      </MemoryRouter>
    );

    // Should render the app without errors
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('wraps all routes with AuthProvider', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('properly structures routing hierarchy', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    // Should have auth provider wrapping protected routes
    const authProvider = screen.getByTestId('auth-provider');
    const protectedRoute = screen.getByTestId('protected-route');
    const userDashboard = screen.getByTestId('user-dashboard');

    expect(authProvider).toBeInTheDocument();
    expect(protectedRoute).toBeInTheDocument();
    expect(userDashboard).toBeInTheDocument();
  });
});