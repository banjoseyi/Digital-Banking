import AppError from "../utils/AppError.js";
import nibss from "../service/nibssClient.js";
import Transaction from "../model/Transaction.js";
import Account from "../model/Account.js";


const transferFunds = async (req, res, next) => {
    try {

        const { to, amount } = req.body;



        const senderAccountNumber = await Account.findOne({ user: req.user._id, });

        if (!senderAccountNumber) {
            throw new AppError("Account number is required", 400);
        }

        if (senderAccountNumber.accountNumber === to) {
            throw new AppError("You can't transfer funds to yourselft", 400);
        }

        const { data: nibssResponse } = await nibss.post("/api/transfer", {
            from: senderAccountNumber.accountNumber,
            to,
            amount: String(amount),
        })

        if (!nibssResponse.reference) {
            throw new AppError(nibssResponse.message || "Transfer failed", 400);
        }

        await Transaction.create({
            user: req.user._id,
            transactionId: nibssResponse.reference,
            from: senderAccountNumber.accountNumber,
            to: nibssResponse.receiverAccount,
            amount: nibssResponse.amount,
            status: nibssResponse.status
        })

        return res.status(200).json({
            success: true,
            message: "Transfer successful",
            data: {
                transactionId: nibssResponse.reference,
                from: senderAccountNumber.accountNumber,
                to: nibssResponse.receiverAccount,
                amount: nibssResponse.amount,
                status: nibssResponse.status,
            },
        });

    } catch (error) {
        if (error.response) {
            return next(new AppError(
                error.response.data?.message || "Unable to process transfer",
                error.response.status || 500
            ));
        }
        next(error);
    }
}

const checkTransactionStatus = async (req, res, next) => {
    try {
        const { transactionId } = req.params;


        // only allow checking transactions this user actually owns
        const localTransaction = await Transaction.findOne({
            user: req.user._id,
            transactionId
        })

        if (!localTransaction) {
            throw new AppError("Transaction not found", 404);
        }

        const { data } = await nibss.get(`/api/transaction/${transactionId}`);

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error) {
        if (error.response) {
            return next(new AppError(
                error.response.data?.message || "Unable to retrive transaction status",
                error.response.status || 500
            ));
        }
        next(error);
    }
}

export default {
    transferFunds,
    checkTransactionStatus
}