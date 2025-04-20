import { z } from 'zod';

// Email validation with proper format check
export const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(5, "Email must be at least 5 characters")
  .max(100, "Email must be less than 100 characters");

// Password validation with security requirements
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  );

// Login credentials validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Registration validation
export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Password reset validation
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// User profile update validation
export const profileUpdateSchema = z.object({
  name: z.string().optional(),
  email: emailSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
  confirmNewPassword: z.string().optional(),
}).refine((data) => {
  // If new password is provided, current password must be provided
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required to set a new password",
  path: ["currentPassword"],
}).refine((data) => {
  // If new password is provided, it must match confirm password
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    return false;
  }
  return true;
}, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
});

// Card validation schema
export const cardSchema = z.object({
  number: z.string()
    .min(15, "Card number must be at least 15 digits")
    .max(19, "Card number must be less than 19 digits")
    .regex(/^\d+$/, "Card number must contain only digits"),
  name: z.string()
    .min(2, "Cardholder name must be at least 2 characters")
    .max(100, "Cardholder name must be less than 100 characters"),
  expiry: z.string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Expiry date must be in MM/YY format"),
  cvv: z.string()
    .min(3, "CVV must be at least 3 digits")
    .max(4, "CVV must be less than 4 digits")
    .regex(/^\d+$/, "CVV must contain only digits"),
  type: z.enum(["visa", "mastercard", "amex", "discover"]),
  isDefault: z.boolean().optional(),
});

// Transaction validation schema
export const transactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().max(255, "Description must be less than 255 characters"),
  category: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  type: z.enum(["income", "expense", "transfer"]),
}); 