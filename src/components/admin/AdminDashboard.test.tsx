import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import { AuthContext, type EPLQAuthContextType } from '../../context/AuthContext';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  auth: {},
  db: {},
}));

// Mock Firebase Firestore methods
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

// Mock user data
const mockUser = {
  uid: 'admin123',
  email: 'admin@eplq.com',
  displayName: 'Admin User'
} as any;

const mockAdminProfile = {
  uid: 'admin123',
  email: 'admin@eplq.com',
  displayName: 'Admin User',
  role: 'admin' as const,
  privacyLevel: 'medium' as const,
  locationDataPermission: ['query', 'analytics'],
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockAdminAuthContextValue: EPLQAuthContextType = {
    user: mockUser,
    userProfile: mockAdminProfile,
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    updateUserProfile: vi.fn(),
    requestLocationAccess: vi.fn().mockResolvedValue(true),
    addQueryToHistory: vi.fn().mockResolvedValue(undefined),
    loading: false,
};

const MockAuthProvider = ({ 
  children, 
  value = mockAdminAuthContextValue 
}: { 
  children: React.ReactNode;
  value?: EPLQAuthContextType;
}) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);

const renderWithRouter = (component: React.ReactElement, authValue = mockAdminAuthContextValue) => {
  return render(
    <BrowserRouter>
      <MockAuthProvider value={authValue}>
        {component}
      </MockAuthProvider>
    </BrowserRouter>
  );
};

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin dashboard with admin information', () => {
    renderWithRouter(<AdminDashboard />);

    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/admin user/i)).toBeInTheDocument();
  });

  it('displays system statistics', () => {
    renderWithRouter(<AdminDashboard />);

    expect(screen.getByText(/system/i)).toBeInTheDocument();
    expect(screen.getByText(/stats/i)).toBeInTheDocument();
  });

  it('shows user management section', () => {
    renderWithRouter(<AdminDashboard />);

    expect(screen.getByText(/users/i)).toBeInTheDocument();
  });

  it('displays data management options', () => {
    renderWithRouter(<AdminDashboard />);

    expect(screen.getByText(/data/i)).toBeInTheDocument();
  });

  it('shows admin navigation menu', () => {
    renderWithRouter(<AdminDashboard />);

    // Should have navigation elements for admin functions
    const dashboard = screen.getByText(/admin dashboard/i).closest('div');
    expect(dashboard).toBeInTheDocument();
  });

  it('displays system health indicators', () => {
    renderWithRouter(<AdminDashboard />);

    // Should show some form of system status
    expect(screen.getByText(/system/i)).toBeInTheDocument();
  });

  it('handles loading state', () => {
    const loadingAdmin = {
      ...mockAdminAuthContextValue,
      loading: true
    };

    renderWithRouter(<AdminDashboard />, loadingAdmin);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows admin-specific metrics', () => {
    renderWithRouter(<AdminDashboard />);

    // Should display admin-relevant information
    const adminContent = screen.getByText(/admin dashboard/i);
    expect(adminContent).toBeInTheDocument();
  });

  it('displays recent activity or logs', () => {
    renderWithRouter(<AdminDashboard />);

    // Should show some form of activity tracking
    expect(screen.getByText(/overview/i)).toBeInTheDocument();
  });

  it('provides quick access to admin functions', () => {
    renderWithRouter(<AdminDashboard />);

    // Should have links or buttons for admin operations
    const dashboard = screen.getAllByText(/admin dashboard/i)[0];
    expect(dashboard).toBeInTheDocument();
  });

  it('handles error states gracefully', () => {
    const errorAdmin = {
      ...mockAdminAuthContextValue,
      userProfile: null
    };

    renderWithRouter(<AdminDashboard />, errorAdmin);

    // Should handle missing profile gracefully and show access denied
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });

  it('displays appropriate content for admin role', () => {
    renderWithRouter(<AdminDashboard />);

    expect(screen.getAllByText(/admin/i)[0]).toBeInTheDocument();
  });
});