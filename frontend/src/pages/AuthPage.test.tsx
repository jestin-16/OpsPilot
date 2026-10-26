import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthPage } from './AuthPage';
import { api } from '../services/api';

vi.mock('../services/api', async (importOriginal) => ({
  ...await importOriginal<typeof import('../services/api')>(),
  api: {
    login: vi.fn(),
    register: vi.fn(),
    googleLogin: vi.fn(),
  },
}));

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }: { onSuccess: (value: { credential: string }) => void }) => <button type="button" onClick={() => onSuccess({ credential: 'test-google-token' })}>Continue with Google</button>,
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
    vi.resetAllMocks();
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  });

  const renderWithRouter = (initialPath = '/login') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
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

  it('focuses the missing password on login submission', async () => {
    const user = userEvent.setup();
    const { container } = renderWithRouter('/login');
    const loginPanel = container.querySelector('.auth-panel--login') as HTMLElement;

    const emailInput = within(loginPanel).getByPlaceholderText('Work Email');
    const passwordInput = within(loginPanel).getByPlaceholderText('Password');
    const submitBtn = within(loginPanel).getByRole('button', { name: /Sign In/i });

    await user.type(emailInput, 'user@opspilot.io');
    await user.click(submitBtn);

    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(passwordInput).toHaveFocus();
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

  it('registers successfully and returns to sign in without email verification', async () => {
    const user = userEvent.setup();
    (api.register as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: 'newuser@opspilot.io',
      message: 'Account created. Sign in to continue.',
      verificationRequired: false,
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
      expect(screen.getByRole('heading', { name: 'Sign in to OpsPilot' })).toBeInTheDocument();
      expect(screen.getByText('Account created. Sign in to continue.')).toBeInTheDocument();
    });
  });

  it('waits for blur before validating, then clears the field error as it is corrected', async () => {
    const user = userEvent.setup();
    renderWithRouter();
    const input = screen.getByRole('textbox', { name: 'Work email' });
    await user.type(input, 'alice');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    await user.tab();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await user.type(input, '@opspilot.io');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('keeps inactive forms inert and hides passwords when switching modes', async () => {
    const user = userEvent.setup();
    const { container } = renderWithRouter();
    const loginPanel = container.querySelector('.auth-panel--login') as HTMLElement;
    const signupPanel = container.querySelector('.auth-panel--signup') as HTMLElement;
    expect(signupPanel).toHaveAttribute('inert');
    expect(within(loginPanel).getByLabelText('Work email')).toHaveAttribute('autocomplete', 'username');
    await user.type(within(loginPanel).getByLabelText('Password', { exact: true }), 'Password123');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    await user.click(screen.getByRole('button', { name: /Get Started Free/ }));
    expect(loginPanel).toHaveAttribute('inert');
    expect(signupPanel).not.toHaveAttribute('inert');
    expect(within(signupPanel).getByLabelText('Password', { exact: true })).toHaveAttribute('type', 'password');
    expect(within(signupPanel).getByLabelText('Password', { exact: true })).toHaveValue('Password123');
    expect(within(signupPanel).getByLabelText('Password', { exact: true })).toHaveAttribute('autocomplete', 'new-password');
  });

  it('keeps server errors visible when focus moves without editing', async () => {
    const user = userEvent.setup();
    vi.mocked(api.login).mockRejectedValueOnce(new Error('Unable to sign in'));
    renderWithRouter();
    await user.type(screen.getByRole('textbox', { name: 'Work email' }), 'alice@opspilot.io');
    await user.type(screen.getByLabelText('Password', { exact: true, selector: '#password-login' }), 'Password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    const error = await screen.findByRole('alert');
    await user.click(screen.getByRole('textbox', { name: 'Work email' }));
    await user.tab();
    expect(error).toBeInTheDocument();
  });

  it('blocks duplicate requests and ignores a login response after switching to signup', async () => {
    const user = userEvent.setup();
    let resolveLogin!: (value: Awaited<ReturnType<typeof api.login>>) => void;
    vi.mocked(api.login).mockReturnValueOnce(new Promise(resolve => { resolveLogin = resolve; }));
    const { container } = renderWithRouter();
    await user.type(screen.getByRole('textbox', { name: 'Work email' }), 'alice@opspilot.io');
    await user.type(screen.getByLabelText('Password', { exact: true, selector: '#password-login' }), 'Password123');
    const form = container.querySelector('.auth-panel--login form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(api.login).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Authenticating...' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Get Started Free/ }));
    await act(async () => resolveLogin({ token: 'test-token' } as Awaited<ReturnType<typeof api.login>>));
    expect(mockLogin).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeEnabled();
  });

  it('shows Google registration errors inside its cancellable role dialog', async () => {
    const user = userEvent.setup();
    vi.mocked(api.googleLogin).mockRejectedValueOnce(new Error('Role is required'));
    vi.mocked(api.googleLogin).mockRejectedValueOnce(new Error('Please retry'));
    renderWithRouter();
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Complete Sign Up' }));
    expect(await within(dialog).findByRole('alert')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows all required signup errors and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    renderWithRouter('/signup');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    for (const message of ['Name is required', 'Email is required', 'Password is required', 'Please confirm your password']) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
    expect(screen.getByLabelText('Full name')).toHaveFocus();
    expect(api.register).not.toHaveBeenCalled();
  });

  it('updates password requirements and confirmation errors when the original password changes', async () => {
    const user = userEvent.setup();
    renderWithRouter('/signup');
    const password = screen.getByLabelText('Password', { exact: true, selector: '#password-signup' });
    const confirm = screen.getByLabelText('Confirm password', { selector: '#signup-confirm' });
    await user.type(password, 'Password123!');
    expect(screen.getByRole('list', { name: 'Password requirements' }).querySelectorAll('[data-met=true]')).toHaveLength(4);
    await user.type(confirm, 'Password123!');
    await user.tab();
    expect(confirm).toHaveAttribute('aria-invalid', 'false');
    await user.type(password, 'changed');
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(confirm).toHaveAttribute('aria-invalid', 'true');
  });

  it('places backend field errors beside inputs and clears only the edited field', async () => {
    const user = userEvent.setup();
    vi.mocked(api.login).mockRejectedValueOnce({ isAxiosError: true, response: { status: 400, data: { fieldErrors: { email: 'This email is not permitted', password: 'Please use a different password' } } } });
    renderWithRouter();
    const email = screen.getByRole('textbox', { name: 'Work email' });
    await user.type(email, 'alice@example.com');
    await user.type(screen.getByLabelText('Password', { exact: true, selector: '#password-login' }), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('This email is not permitted')).toBeInTheDocument();
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute('aria-describedby', 'email-login-error');
    await user.type(email, '.au');
    expect(screen.queryByText('This email is not permitted')).not.toBeInTheDocument();
    expect(screen.getByText('Please use a different password')).toBeInTheDocument();
  });

  it('explains rate limiting and restores the submit button after failure', async () => {
    const user = userEvent.setup();
    vi.mocked(api.login).mockRejectedValueOnce({ isAxiosError: true, response: { status: 429, data: {} } });
    renderWithRouter();
    await user.type(screen.getByRole('textbox', { name: 'Work email' }), 'alice@example.com');
    await user.type(screen.getByLabelText('Password', { exact: true, selector: '#password-login' }), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts. Please wait a moment and try again.');
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled();
  });
});
