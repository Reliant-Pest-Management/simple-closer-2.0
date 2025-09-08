// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { validate } = require('../middleware/validation.middleware');

const prisma = new PrismaClient();

// Validation schemas
const registerSchema = Joi.object({
  // Company info
  companyName: Joi.string().required().min(2).max(100),
  companyEmail: Joi.string().email().required(),
  companyPhone: Joi.string().required(),
  
  // Admin user info
  firstName: Joi.string().required().min(2).max(50),
  lastName: Joi.string().required().min(2).max(50),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(8).max(100),
  phone: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Helper function to generate JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      branchId: user.branchId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Register first company and admin user
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const {
      companyName,
      companyEmail,
      companyPhone,
      firstName,
      lastName,
      email,
      password,
      phone,
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create company and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: companyEmail,
          phone: companyPhone,
          subscriptionStatus: 'TRIAL',
          subscriptionPlan: 'STARTER',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'ADMIN',
          isActive: true,
        },
      });

      // Enable all modules by default for new company
      const modules = await tx.module.findMany();
      for (const module of modules) {
        await tx.companyModule.create({
          data: {
            companyId: company.id,
            moduleId: module.id,
            isEnabled: true,
          },
        });
      }

      return { company, user };
    });

    // Generate token
    const token = generateToken(result.user);

    res.status(201).json({
      success: true,
      message: 'Company and admin user created successfully',
      data: {
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
        },
        company: {
          id: result.company.id,
          name: result.company.name,
          trialEndsAt: result.company.trialEndsAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with company
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        branch: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
          branchId: user.branchId,
        },
        company: {
          id: user.company.id,
          name: user.company.name,
          branchModeEnabled: user.company.branchModeEnabled,
        },
        branch: user.branch ? {
          id: user.branch.id,
          name: user.branch.name,
          code: user.branch.code,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    // Verify current token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    // Generate new token
    const newToken = generateToken(user);

    res.json({
      success: true,
      data: { token: newToken },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
    next(error);
  }
});

// Change password (authenticated)
router.post('/change-password', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password data',
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;