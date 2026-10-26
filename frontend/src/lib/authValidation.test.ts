import { describe, expect, it } from 'vitest';
import { LoginSchema, RegisterSchema, SignupSchema } from './authValidation';

const signup = { name: 'Ana María O’Neill', email: 'ana+work@example.com', password: 'Password123!', confirmPassword: 'Password123!', role: 'Developer' };

describe('authentication validation', () => {
  it.each(['', '   '])('requires an email for login and signup (%j)', email => {
    for (const schema of [LoginSchema, SignupSchema]) {
      const result = schema.safeParse({ ...signup, email });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues.find(issue => issue.path[0] === 'email')?.message).toBe('Email is required');
    }
  });

  it.each(['alice', 'alice@', 'alice@example', 'a b@example.com', 'alice@@example.com'])('rejects malformed email %s', email => {
    expect(LoginSchema.safeParse({ ...signup, email }).success).toBe(false);
    expect(SignupSchema.safeParse({ ...signup, email }).success).toBe(false);
  });

  it('normalizes surrounding name and email whitespace and preserves the exact password', () => {
    const password = ' Password123! ';
    const parsed = SignupSchema.parse({ ...signup, name: '  Ana María O’Neill  ', email: '  ana+work@example.com  ', password, confirmPassword: password });
    expect(parsed.name).toBe(signup.name);
    expect(parsed.email).toBe(signup.email);
    expect(parsed.password).toBe(password);
    expect(LoginSchema.parse({ email: ' ana@example.com ', password }).password).toBe(password);
  });

  it.each(['', '   ', '12345', 'Ana\u0000Smith'])('rejects missing or invalid names %j', name => {
    expect(SignupSchema.safeParse({ ...signup, name }).success).toBe(false);
  });

  it.each(['李', 'محمد علي', 'Jean-Luc Picard', "O'Connor", 'D’Arcy', 'Ana María'])('accepts international names %s', name => {
    expect(SignupSchema.safeParse({ ...signup, name }).success).toBe(true);
  });

  it.each(['', '   '])('rejects blank login passwords without applying signup complexity (%j)', password => {
    expect(LoginSchema.safeParse({ ...signup, password }).success).toBe(false);
    expect(LoginSchema.safeParse({ ...signup, password: 'legacy' }).success).toBe(true);
  });

  it.each(['', 'Aa1', 'lowercase123', 'UPPERCASE123', 'NoNumbersHere'])('rejects signup passwords that miss requirements (%j)', password => {
    expect(SignupSchema.safeParse({ ...signup, password, confirmPassword: password }).success).toBe(false);
  });

  it('checks the password encoder limit using UTF-8 bytes and never truncates', () => {
    const accepted = 'Aa1' + '🙂'.repeat(17);
    const rejected = 'Aa1' + '🙂'.repeat(18);
    expect(RegisterSchema.parse({ ...signup, password: accepted }).password).toBe(accepted);
    expect(RegisterSchema.safeParse({ ...signup, password: rejected }).success).toBe(false);
    expect(RegisterSchema.safeParse({ ...signup, password: 'Aa1' + 'x'.repeat(70) }).success).toBe(false);
  });

  it('rejects names and emails that exceed database column lengths', () => {
    expect(RegisterSchema.safeParse({ ...signup, name: 'A'.repeat(256) }).success).toBe(false);
    expect(RegisterSchema.safeParse({ ...signup, email: 'a@' + 'b'.repeat(250) + '.com' }).success).toBe(false);
  });

  it('requires confirmation to match exactly, including whitespace', () => {
    const result = SignupSchema.safeParse({ ...signup, confirmPassword: signup.password + ' ' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toContainEqual(expect.objectContaining({ path: ['confirmPassword'], message: 'Passwords do not match' }));
  });

  it.each(['', 'Admin', 'Administrator', 'Other'])('rejects unapproved signup roles %j', role => {
    expect(SignupSchema.safeParse({ ...signup, role }).success).toBe(false);
  });
});
