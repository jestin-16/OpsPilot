import { z } from 'zod';

const EmailSchema = z.string()
  .trim()
  .min(1, 'Email is required')
  .max(255, 'Email must be 255 characters or fewer')
  .email('Enter a valid email address');

export const SignupRoleSchema = z.enum(['Developer', 'DevOps'], { message: 'Choose Developer or DevOps' });

export const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'An uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'A lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'A number', test: (value: string) => /\d/.test(value) },
];

export const RegisterSchema = z.object({
  name: z.string().trim()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or fewer')
    .refine(value => !value || /\p{L}/u.test(value), 'Enter a name containing at least one letter')
    .refine(value => !/[\p{Cc}]/u.test(value), 'Name must not contain control characters'),
  email: EmailSchema,
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit')
    // BCrypt encodes at most 72 UTF-8 bytes. Never truncate or trim a password.
    .refine(value => new TextEncoder().encode(value).length <= 72, 'Password is too long. Use fewer characters.'),
  role: SignupRoleSchema,
});

export const SignupSchema = RegisterSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const LoginSchema = z.object({
  email: EmailSchema,
  // Existing accounts may use passwords that predate the signup rules.
  password: z.string().refine(value => value.trim().length > 0, 'Password is required'),
});
