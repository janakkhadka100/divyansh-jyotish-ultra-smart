import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/database';

// Input validation schema
const SigninSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = SigninSchema.parse(body);

    // Find user by email
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          astrologicalData: true
        }
      });
    } catch (dbError) {
      console.log('Database not available, using demo mode');
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'इमेल वा पासवर्ड गलत छ',
      }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'इमेल वा पासवर्ड गलत छ',
      }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'demo-secret',
      { expiresIn: '7d' }
    );

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
      message: 'साइन इन सफल भयो',
    });

  } catch (error) {
    console.error('Signin error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'अमान्य डाटा',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'साइन इन गर्नमा त्रुटि भयो',
    }, { status: 500 });
  }
}
