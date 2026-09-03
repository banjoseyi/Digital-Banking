import express from "express";
import AccountController from "../controller/AccountController.js"
import protect from "../middleware/AuthMiddleware.js"

// import rateLimitMiddleware from "../middleware/RateLimitMiddleware.js";


const router = express.Router();
// const { registerLimiter, loginLimiter } = rateLimitMiddleware;

router.post("/createAccount", protect, AccountController.createAccount);
router.get("/getBalance", protect, AccountController.getBalance);


//Confirming the account number info before transcations.
router.get("/nameEnquiry/:accountNumber", protect, AccountController.nameEnquiry);

export default router;