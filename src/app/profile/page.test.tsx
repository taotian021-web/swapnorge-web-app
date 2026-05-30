import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-public-key';

const signInWithPasswordMock = jest.fn();
const signUpMock = jest.fn();
const signInAnonymouslyMock = jest.fn();
const toastMock = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => 'no',
  }),
}));

jest.mock('@/supabase/config', () => ({
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'anon-public-key',
}));

jest.mock('@/supabase/hooks', () => ({
  useSupabaseUser: () => ({ user: null, isUserLoading: false, userError: null }),
  useSupabaseProfile: () => ({ profile: null, isLoading: false, error: null }),
}));

jest.mock('@/supabase/provider', () => ({
  useSupabase: () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signUp: signUpMock,
      signInAnonymously: signInAnonymouslyMock,
    },
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

import ProfilePage from './page';

describe('Profile Page auth view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login/register controls', () => {
    render(<ProfilePage />);

    expect(screen.getAllByRole('button', { name: /Logg inn|Login/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /Registrer|Register/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('submits login form with email and password', async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { session: {} }, error: null });

    render(<ProfilePage />);

    fireEvent.change(screen.getByLabelText(/E-post|Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Passord|Password/i, { selector: 'input' }), {
      target: { value: '123456' },
    });
    fireEvent.submit(screen.getByTestId('auth-form'));

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '123456',
      });
    });
  });

  it('submits register form and calls signUp', async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: 'abc123' }, session: {} }, error: null });

    render(<ProfilePage />);

    const registerModeButton = screen.getAllByRole('button', { name: /Registrer|Register/i })[0];
    fireEvent.pointerDown(registerModeButton);
    fireEvent.click(registerModeButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Bekreft passord|Confirm Password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/E-post|Email/i), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(screen.getAllByLabelText(/Passord|Password/i, { selector: 'input' })[0], {
      target: { value: 'abcdef' },
    });
    fireEvent.change(screen.getByLabelText(/Bekreft passord|Confirm Password/i), {
      target: { value: 'abcdef' },
    });
    fireEvent.submit(screen.getByTestId('auth-form'));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'abcdef',
        options: {
          data: {
            guest: false,
          },
          emailRedirectTo: expect.stringContaining('/profile?lang=no'),
        },
      });
      expect(screen.getByText(/Registrering vellykket!|Registration successful!/i)).toBeInTheDocument();
    });
  });

  it('shows verification email sent message when registration requires email confirm', async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: 'abc123' }, session: null }, error: null });

    render(<ProfilePage />);

    fireEvent.click(screen.getAllByRole('button', { name: /Registrer|Register/i })[0]);
    fireEvent.change(screen.getByLabelText(/E-post|Email/i), {
      target: { value: 'verify@example.com' },
    });
    fireEvent.change(screen.getAllByLabelText(/Passord|Password/i, { selector: 'input' })[0], {
      target: { value: 'abcdef' },
    });
    fireEvent.change(screen.getByLabelText(/Bekreft passord|Confirm Password/i), {
      target: { value: 'abcdef' },
    });
    fireEvent.submit(screen.getByTestId('auth-form'));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalled();
      expect(screen.getByText(/Sjekk innboksen|verification email/i)).toBeInTheDocument();
      expect(window.localStorage.getItem('sn_pending_verification_email')).toBe('verify@example.com');
    });
  });

  it('disables submit when register passwords mismatch', async () => {
    render(<ProfilePage />);

    fireEvent.click(screen.getAllByRole('button', { name: /Registrer|Register/i })[0]);
    fireEvent.change(screen.getByLabelText(/E-post|Email/i), {
      target: { value: 'mismatch@example.com' },
    });
    fireEvent.change(screen.getAllByLabelText(/Passord|Password/i)[0], {
      target: { value: 'abcdef' },
    });
    fireEvent.change(screen.getByLabelText(/Bekreft passord|Confirm Password/i), {
      target: { value: 'abcdeg' },
    });

    const submitButton = screen.getByRole('button', { name: /Opprett konto|Create account/i });
    expect(submitButton).toBeDisabled();
  });

  it('renders accessible password toggle buttons', () => {
    render(<ProfilePage />);

    expect(screen.getAllByRole('button', { name: /Show password|Vis passord/i }).length).toBeGreaterThanOrEqual(1);
  });
});
