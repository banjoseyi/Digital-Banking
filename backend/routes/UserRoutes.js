import express from "express";
import UserController from "../controller/UserController.js";
import validate from "../middleware/Validate.js";
import userValidator from "../validator/userValidator.js"
import rateLimitMiddleware from "../middleware/RateLimitMiddleware.js";
import kycValidator from "../validator/kycValidator.js";
import protect from "../middleware/AuthMiddleware.js"

const router = express.Router();
const { registerSchema, loginSchema } = userValidator;
const { registerLimiter, loginLimiter } = rateLimitMiddleware;


router.post("/register", registerLimiter, validate(registerSchema), UserController.registerUser);
router.post("/login", loginLimiter, validate(loginSchema), UserController.loginUser);
router.post("/refresh", UserController.refreshAccessToken);
router.post("/logout", protect, UserController.logoutUser);

// kyc
router.post("/kyc", protect, validate(kycValidator.kycSchema), UserController.submitKyc);


export default router;