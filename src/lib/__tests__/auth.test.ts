import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getServerUser, signIn, signUp, signOut, getSession, validateSession } from '@/lib/auth';

// ─── Supabase mock ────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockFrom = vi.fn();

const mockServerClient = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
};

const mockBrowserClient = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
    getSession: mockGetSession,
  },
};

vi.mock('@/lib/supabase', () => ({
  supabase: {},
  createServerClient: vi.fn(() => mockServerClient),
  createBrowserClient: vi.fn(() => mockBrowserClient),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProfileQuery(profile: Record<string, unknown> | null) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profile, error: null }),
  };
  return chainable;
}

function makeBase64Token(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

// ─── getServerUser ────────────────────────────────────────────────────────────

describe('getServerUser', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when Supabase returns no user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await getServerUser();
    expect(result).toBeNull();
  });

  it('returns user with profile data when both are present', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'alice@law.com' } },
    });
    mockFrom.mockReturnValue(makeProfileQuery({ name: 'Alice', role: 'socio' }));

    const result = await getServerUser();

    expect(result).toEqual({
      id: 'user-1',
      email: 'alice@law.com',
      name: 'Alice',
      role: 'socio',
    });
  });

  it('falls back to email prefix for name when profile has none', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-2', email: 'bob@law.com' } },
    });
    mockFrom.mockReturnValue(makeProfileQuery(null));

    const result = await getServerUser();

    expect(result?.name).toBe('bob');
    expect(result?.role).toBe('advogado');
  });

  it('falls back to "Usuário" when email is missing', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-3', email: undefined } },
    });
    mockFrom.mockReturnValue(makeProfileQuery(null));

    const result = await getServerUser();
    expect(result?.name).toBe('Usuário');
  });

  it('uses default role "advogado" when profile has no role', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-4', email: 'carol@law.com' } },
    });
    mockFrom.mockReturnValue(makeProfileQuery({ name: 'Carol', role: null }));

    const result = await getServerUser();
    expect(result?.role).toBe('advogado');
  });
});

// ─── signIn ───────────────────────────────────────────────────────────────────

describe('signIn', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns data on successful sign-in', async () => {
    const session = { access_token: 'tok', user: { id: 'u1', email: 'a@b.com' } };
    mockSignInWithPassword.mockResolvedValueOnce({ data: session, error: null });

    const result = await signIn('a@b.com', 'password');
    expect(result).toEqual(session);
  });

  it('throws the Supabase error on failure', async () => {
    const supaError = new Error('Invalid login credentials');
    mockSignInWithPassword.mockResolvedValueOnce({ data: null, error: supaError });

    await expect(signIn('a@b.com', 'wrong')).rejects.toThrow('Invalid login credentials');
  });

  it('passes email and password to Supabase', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { access_token: 'tok' },
      error: null,
    });

    await signIn('user@firm.com', 'secret123');

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@firm.com',
      password: 'secret123',
    });
  });
});

// ─── signUp ───────────────────────────────────────────────────────────────────

describe('signUp', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns data on successful sign-up', async () => {
    const userData = { user: { id: 'new-user' }, session: null };
    mockSignUp.mockResolvedValueOnce({ data: userData, error: null });

    const result = await signUp('new@firm.com', 'pass', 'New User');
    expect(result).toEqual(userData);
  });

  it('throws on Supabase error', async () => {
    mockSignUp.mockResolvedValueOnce({ data: null, error: new Error('Email taken') });
    await expect(signUp('taken@firm.com', 'pass', 'User')).rejects.toThrow('Email taken');
  });

  it('passes name as metadata option', async () => {
    mockSignUp.mockResolvedValueOnce({ data: {}, error: null });
    await signUp('x@x.com', 'p', 'John');
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'x@x.com',
      password: 'p',
      options: { data: { name: 'John' } },
    });
  });
});

// ─── signOut ──────────────────────────────────────────────────────────────────

describe('signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    mockSignOut.mockResolvedValueOnce({});
    await signOut();
    expect(mockSignOut).toHaveBeenCalledOnce();
  });
});

// ─── getSession ───────────────────────────────────────────────────────────────

describe('getSession', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the session when one exists', async () => {
    const session = { access_token: 'abc', user: { id: 'u1' } };
    mockGetSession.mockResolvedValueOnce({ data: { session } });

    const result = await getSession();
    expect(result).toEqual(session);
  });

  it('returns null when there is no session', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    const result = await getSession();
    expect(result).toBeNull();
  });
});

// ─── validateSession ──────────────────────────────────────────────────────────

describe('validateSession', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns user from Supabase when token is valid', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'uid-1', email: 'lawyer@firm.com' } },
    });
    mockFrom.mockReturnValue(makeProfileQuery({ name: 'Lawyer', role: 'socio' }));

    const result = await validateSession('valid-supabase-token');

    expect(result).toEqual({
      id: 'uid-1',
      email: 'lawyer@firm.com',
      name: 'Lawyer',
      role: 'socio',
    });
  });

  it('falls back to Base64 token when Supabase returns no user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const payload = {
      id: 'legacy-uid',
      email: 'legacy@firm.com',
      name: 'Legacy User',
      role: 'admin',
      exp: Date.now() + 60_000, // expires in 1 minute
    };
    const token = makeBase64Token(payload);

    const result = await validateSession(token);

    expect(result).toEqual({
      id: 'legacy-uid',
      email: 'legacy@firm.com',
      name: 'Legacy User',
      role: 'admin',
    });
  });

  it('returns null for expired Base64 token', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const payload = {
      id: 'uid',
      email: 'x@x.com',
      name: 'X',
      role: 'admin',
      exp: Date.now() - 1_000, // already expired
    };
    const token = makeBase64Token(payload);

    const result = await validateSession(token);
    expect(result).toBeNull();
  });

  it('returns null when Base64 token is malformed JSON', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const token = Buffer.from('not-valid-json').toString('base64url');
    const result = await validateSession(token);
    expect(result).toBeNull();
  });

  it('returns null when token is completely invalid', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await validateSession('not-a-token-at-all!!!');
    expect(result).toBeNull();
  });

  it('uses default role "advogado" from Supabase profile when profile role is missing', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'uid-2', email: 'a@b.com' } },
    });
    mockFrom.mockReturnValue(makeProfileQuery({ name: 'Someone', role: null }));

    const result = await validateSession('some-token');
    expect(result?.role).toBe('advogado');
  });

  it('falls back to default role "admin" from Base64 token when role missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const payload = {
      id: 'uid',
      email: 'x@x.com',
      name: 'X',
      // no role field
      exp: Date.now() + 60_000,
    };
    const token = makeBase64Token(payload);

    const result = await validateSession(token);
    expect(result?.role).toBe('admin');
  });
});
