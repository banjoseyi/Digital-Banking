import express from "express";
import TransactionController from "../controller/TransactionController.js";
import protect from "../middleware/AuthMiddleware.js";
import transcationValidator from "../validator/transferValidator.js"
import validate from "../middleware/Validate.js"

const router = express.Router();

router.post("/transfer", protect, validate(transcationValidator.transferSchema), TransactionController.transferFunds);
router.get("/:transactionId", protect, TransactionController.checkTransactionStatus);
router.get("/", protect, TransactionController.getMyTransactions);

export default router;