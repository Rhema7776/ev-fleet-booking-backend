import express from "express";
import * as authController from "../controllers/authController";
import { validateRequest } from "../middleware/validateRequest";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyOtpSchema,
  createPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  socialLoginSchema,
} from "../validators/authValidator";

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account and initiates the email verification process.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "08012345678"
 *               role:
 *                 type: string
 *                 example: INDIVIDUAL_PARTNER
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Invalid registration data
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post("/register", validateRequest(registerSchema), authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate a user and return access and refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */
router.post("/login", validateRequest(loginSchema), authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Generates a new access token using a valid refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: A valid JWT refresh token.
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Newly generated JWT access token.
 *       401:
 *         description: Invalid or expired refresh token
 *       404:
 *         description: User not found
 */
router.post(
  "/refresh",
  validateRequest(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify OTP
 *     description: Verifies the OTP sent to a user's email during registration or another authentication flow.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - purpose
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: "816306"
 *               purpose:
 *                 type: string
 *                 example: REGISTRATION
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired verification code
 *       404:
 *         description: Verification record not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/verify-otp",
  validateRequest(verifyOtpSchema),
  authController.verifyOTP
);

/**
 * @swagger
 * /api/v1/auth/create-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Create account password
 *     description: Creates the password for a user after successful email/OTP verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Password created successfully
 *       400:
 *         description: Invalid password or passwords do not match
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/create-password",
  validateRequest(createPasswordSchema),
  authController.createPassword
);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: Sends a password reset OTP or reset instructions to the user's registered email address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset request processed successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password
 *     description: Resets a user's password using the verification information provided during the password recovery flow.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - password
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired verification code or invalid password
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @swagger
 * /api/v1/auth/social-login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate using a social provider
 *     description: Verifies a social provider ID token and creates or authenticates a user account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - token
 *             properties:
 *               provider:
 *                 type: string
 *                 enum:
 *                   - GOOGLE
 *                   - FACEBOOK
 *                   - APPLE
 *                 example: GOOGLE
 *               token:
 *                 type: string
 *                 description: Social provider ID token.
 *               role:
 *                 type: string
 *                 enum:
 *                   - FLEET_OWNER
 *                   - INDIVIDUAL_PARTNER
 *                 example: INDIVIDUAL_PARTNER
 *                 description: Required when creating a new social account.
 *     responses:
 *       200:
 *         description: Social authentication successful
 *       400:
 *         description: Invalid social authentication request
 *       401:
 *         description: Invalid or unverified social token
 *       409:
 *         description: Email already belongs to another authentication method
 *       500:
 *         description: Internal server error
 */
router.post(
  "/social-login",
  validateRequest(socialLoginSchema),
  authController.socialLogin
);

export default router;
