import Account from "../model/Account.js"
import AppError from "../utils/AppError.js";
import nibss from "../service/nibssClient.js";

const createAccount = async (req, res, next) => {
    try {
        const user = req.user;

        //user must have done KYC before anything..
        if (!user.isKycVerified) {
            throw new AppError("Complete KYC verification before creating an account", 409);
        }

        //user should have just one account
        const existingAccount = await Account.findOne({
            user: user._id,
        })

        if (existingAccount) {
            throw new AppError("You already have an existing bank account", 409);
        }

        // Send the verified user's details to NIBSS 
        const { data: nibssResponse } = await nibss.post("/api/account/create", {
            kycType: user.kycType,
            kycID: user.kycId,
            dob: user.dateOfBirth,
        });

        const accountData = nibssResponse.account;


        if (!accountData?.accountNumber) {
            throw new AppError(nibssResponse.message || "Unable to create bank account", 400);
        }



        //   Save the account in your own database
        const account = await Account.create({
            user: user._id,
            accountNumber: accountData.accountNumber,
            accountName: accountData.accountName,
            bankCode: accountData.bankCode,
            bankName: process.env.NIBSS_BANK_NAME,
        });
        // Return the created account
        return res.status(201).json({
            success: true,
            message: "Bank account created successfully",
            data: {
                account: {
                    id: account._id,
                    accountNumber: account.accountNumber,
                    accountName: account.accountName,
                    bankCode: account.bankCode,
                    bankName: account.bankName,
                },
            },
        });

    } catch (error) {
        if (error.response) {
            return next(new AppError(
                error.response.data?.message || "NIBSS account request failed",
                error.response.status || 500
            )
            );
        }
        next(error);
    }
}


const getBalance = async (req, res, next) => {
    try {

        const account = await Account.findOne({ user: req.user._id });

        if (!account) {
            throw new AppError("No bank account found for this user", 400);
        }

        const { data } = await nibss.get(`/api/account/balance/${account.accountNumber}`);

        return res.status(200).json({
            success: true,
            data: {
                accountNumber: account.accountNumber,
                balance: data.balance,
            },
        });

    } catch (error) {
        if (error.response) {
            return next(new AppError(
                error.response.data?.message || "Unable to fetch balance",
                error.response.status || 500
            ));
        }
        next(error);

    }
};


const nameEnquiry = async (req, res, next) => {
    try {

        const { accountNumber } = req.params;

        if (!accountNumber) {
            throw new AppError("Account number is required", 400);
        }

        const { data } = await nibss.get(`/api/account/name-enquiry/${accountNumber}`)

        return res.status(200).json({
            success: true,
            data: {
                accountNumber: data.accountNumber,
                accountName: data.accountName,
                bankCode: data.bankCode,
            }
        })
    } catch (error) {
        if (error.response) {
            return next(new AppError(
                error.response.data?.message || "Unable to make Enquiry about the account",
                error.response.status || 500
            ));
        }
        next(error);
    }
}




export default {
    createAccount,
    getBalance,
    nameEnquiry
}