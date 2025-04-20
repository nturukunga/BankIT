import { z } from 'zod'

// User validation schemas
export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    ),
})

// Transaction validation schemas
export const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER']),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  recipientId: z.string().optional(),
})

// Account validation schemas
export const accountSchema = z.object({
  name: z.string().min(2, 'Account name must be at least 2 characters'),
  type: z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT']),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
})

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional(),
  address: z.string().min(5, 'Address must be at least 5 characters').optional(),
})

// Helper function to validate data against a schema
export async function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown
): Promise<{ success: boolean; data?: z.infer<T>; error?: string }> {
  try {
    const validData = await schema.parseAsync(data)
    return { success: true, data: validData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Invalid data provided' }
  }
} 