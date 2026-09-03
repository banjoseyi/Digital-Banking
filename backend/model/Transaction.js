import mongoose from "mongoose";

const transactionsSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        from: {
            type: String,
            required: true,
        },
        to: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true
    }
)

const Transaction = mongoose.model("Transaction", transactionsSchema);

export default Transaction;