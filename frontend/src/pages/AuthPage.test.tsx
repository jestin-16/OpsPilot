import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthPage } from './AuthPage';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
    googleLogin: vi.fn(),
  },
  LoginSchema: {
    safeParse: (data: { email?: string; password?: string }) => {
      if (!data.email || !data.email.includes('@')) {
        return { success: false, error: { issues: [{ message: 'Invalid email address' }] } };
      }
      if (!data.password || data.password.length < 6) {
        return { success: false, error: { issues: [{ message: 'Password must be at least 6 characters' }] } };
      }
      return { success: true, data };
    },
  },
  SignupSchema: {
    safeParse: (data: { name?: string; email?: string; password?: string; confirmPassword?: string; role?: string }) => {
      if (!data.name || data.name.trim().length === 0) {
        return { success: false, error: { issues: [{ message: 'Name is required' }] } };
      }
      if (!data.email || !data.email.includes('@')) {
        return { success: false, error: { issues: [{ message: 'Invalid email address' }] } };
      }
      if (!data.password || data.password.length < 8) {
        return { success: false, error: { issues: [{ message: 'Password must be at least 8 characters' }] } };
      }
      if (data.password !== data.confirmPassword) {
        return { success: false, error: { issues: [{ message: 'Passwords do not match' }] } };
      }
      if (data.role === 'Admin') {
        return { success: false, error: { issues: [{ message: 'Admin role cannot be self-assigned' }] } };
      }
      return { success: true, data: { ...data, role: data.role || 'Developer' } };
    },
  },
}));

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <div data-testid="google-login">Google Login Mock</div>,
}));

const mockLogin = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    token: null,
    isAuthenticated: false,
    isSessionLoading: false,
    logout: vi.fn(),
  }),
}));

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialPath = '/login') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/verify-email" element={<div data-testid="verify-email">Verify Email Page</div>} />
          <Route path="/monitoring" element={<div data-testid="monitoring-dashboard">Monitoring Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders login mode by default at /login', () => {
    const { container } = renderWithRouter('/login');
    const loginPanel = container.querySelector('.auth-panel--login') as HTMLElement;
    expect(loginPanel).toBeInTheDocument();

    expect(screen.getByText('Platform Access')).toBeInTheDocument();
    expect(within(loginPanel).getByPlaceholderText('Work Email')).toBeInTheDocument();
    expect(within(loginPanel).getByPlaceholderText('Password')).toBeInTheDocument();
    expect(within(loginPanel).getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('renders signup mode at /signup with full registration fields', () => {
    const { container } = renderWithRouter('/signup');
    const signupPanel = container.querySelector('.auth-panel--signup') as HTMLElement;
    expect(signupPanel).toBeInTheDocument();

    expect(screen.getByText('Platform Registration')).toBeInTheDocument();
    expect(within(signupPanel).getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(within(signupPanel).getByPlaceholderText('Work Email')).toBeInTheDocument();
    expect(within(signupPanel).getByPlaceholderText('Password')).toBeInTheDocument();
    expect(within(signupPanel).getByPlaceholderText('Confirm')).toBeInTheDocument();
    expect(within(signupPanel).getByRole('button', { name: /Create Account/i })).toBeInTheDocument();

    // Verify Admin is NOT an option in role selector (security hardening)
    const select = within(signupPanel).getByRole('combobox');
    expect(select).toBeInTheDocument();
    const options = within(signupPanel).getAllByRole('option').map(o => o.textContent);
    expect(options.some(opt => opt?.includes('Developer'))).toBe(true);
    expect(options.some(opt => opt?.includes('DevOps'))).toBe(true);
    expect(options.some(opt => opt?.includes('Admin'))).toBe(false);
  });

  it('switches to signup mode when clicking the header switch button', async () => {
    const user = userEvent.setup();
    renderWithRouter('/login');

    const switchBtn = screen.getByRole('button', { name: /Get Started Free/i });
    await user.click(switchBtn);

    await waitFor(() => {
      expect(screen.getByText('Platform Registration')).toBeInTheDocument();
    });
  });

  it('shows validation error when password is too short during login', async () => {
    const user = userEvent.setup();
    const { container } = renderWithRouter('/login');
    const loginPanel = container.querySelector('.auth-panel--login') as HTMLElement;

    const emailInput = within(loginPanel).getByPlaceholderText('Work Email');
    const passwordInput = within(loginPanel).getByPlaceholderText('Password');
    const submitBtn = within(loginPanel).getByRole('button', { name: /Sign In/i });

    await user.type(emailInput, 'user@opspilot.io');
    await user.type(passwordInput, '123');
    await user.click(submitBtn);

    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  it('successfully logs in with valid credentials and redirects', async () => {
    const user = userEvent.setup();
    (api.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      token: 'valid-jwt-token',
      id: 1,
      name: 'Test User',
      email: 'user@opspilot.io',
      roles: ['Developer'],
    });

    const { container } = renderWithRouter('/login');
    const loginPanel = container.querySelector('.auth-panel--login') as HTMLElement;

    const emailInput = within(loginPanel).getByPlaceholderText('Work Email');
    const passwordInput = within(loginPanel).getByPlaceholderText('Password');
    const submitBtn = within(loginPanel).getByRole('button', { name: /Sign In/i });

    await user.type(emailInput, 'user@opspilot.io');
    await user.type(passwordInput, 'validpassword');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({
        email: 'user@opspilot.io',
        password: 'validpassword',
      });
      expect(mockLogin).toHaveBeenCalled();
      expect(screen.getByTestId('monitoring-dashboard')).toBeInTheDocument();
    });
  });

  it('shows validation error when passwords do not match in signup', async () => {
    const user = userEvent.setup();
    const { container } = renderWithRouter('/signup');
    const signupPanel = container.querySelector('.auth-panel--signup') as HTMLElement;

    await user.type(within(signupPanel).getByPlaceholderText('Full Name'), 'Alice Doe');
    await user.type(within(signupPanel).getByPlaceholderText('Work Email'), 'alice@opspilot.io');
    await user.type(within(signupPanel).getByPlaceholderText('Password'), 'Password123!');
    await user.type(within(signupPanel).getByPlaceholderText('Confirm'), 'Mismatched123!');
    await user.click(within(signupPanel).getByRole('button', { name: /Create Account/i }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(api.register).not.toHaveBeenCalled();
  });

  it('registers successfully and redirects to email verification', async () => {
    const user = userEvent.setup();
    (api.register as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 42,
      email: 'newuser@opspilot.io',
      name: 'New User',
      roles: ['Developer'],
    });

    const { container } = renderWithRouter('/signup');
    const signupPanel = container.querySelector('.auth-panel--signup') as HTMLElement;

    await user.type(within(signupPanel).getByPlaceholderText('Full Name'), 'New User');
    await user.type(within(signupPanel).getByPlaceholderText('Work Email'), 'newuser@opspilot.io');
    await user.type(within(signupPanel).getByPlaceholderText('Password'), 'SecurePass123!');
    await user.type(within(signupPanel).getByPlaceholderText('Confirm'), 'SecurePass123!');
    await user.click(within(signupPanel).getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(api.register).toHaveBeenCalledWith({
        name: 'New User',
        email: 'newuser@opspilot.io',
        password: 'SecurePass123!',
        role: 'Developer',
      });
      expect(screen.getByTestId('verify-email')).toBeInTheDocument();
    });
  });
});
