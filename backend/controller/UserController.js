import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../model/User.js";
import AppError from "../utils/AppError.js";
import nibss from "../service/nibssClient.js";
import { createAccessToken, createRefreshToken } from "../utils/Tokens.js";

const registerUser = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new AppError("An account with this email already exists", 409);
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    isKycVerified: user.isKycVerified,
                    createdAt: user.createdAt,
                },
            },
        });


    } catch (error) {
        next(error);
    }
}



const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            throw new AppError("Invalid email or password", 401);
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            throw new AppError("Invalid email or password", 401);
        }

        const accessToken = createAccessToken(user._id.toString());
        const refreshToken = createRefreshToken(user._id.toString());

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    isKycVerified: user.isKycVerified,
                },
                accessToken,
            },
        });

    } catch (error) {
        next(error);
    }
};


const refreshAccessToken = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            throw new AppError("Refresh token missing", 401);
        }

        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, {
            issuer: "digital-banking-api",
            audience: "digital-banking-client",
        });

        if (decoded.type !== "refresh") {
            throw new AppError("Invalid token type", 401);
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            throw new AppError("User no longer exists", 401);
        }

        const accessToken = createAccessToken(user._id.toString());

        return res.status(200).json({
            success: true,
            accessToken,
        });

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return next(new AppError("Refresh token expired, please log in again", 401));
        }
        if (error.name === "JsonWebTokenError") {
            return next(new AppError("Invalid refresh token", 401));
        }
        next(error);
    }
};

const logoutUser = async (req, res, next) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        next(error);
    }
};


const submitKyc = async (req, res, next) => {
    try {
        const { kycType, kycId, firstName, lastName, dateOfBirth, phone } = req.body;

        if (req.user.isKycVerified) {
            throw new AppError("KYC already completed for this account", 409);
        }

        //Stage 1
        try {
            if (kycType === "bvn") {
                await nibss.post("/api/insertBvn", {
                    bvn: kycId,
                    firstName,
                    lastName,
                    dob: dateOfBirth,
                    phone,
                });
            } else {
                await nibss.post("/api/insertNin", {
                    nin: kycId,
                    firstName,
                    lastName,
                    dob: dateOfBirth,
                });
            }
        } catch (insertError) {
            const alreadyExists = insertError.response?.status === 409
                && /already exists/i.test(insertError.response?.data?.message || "");

            if (!alreadyExists) {
                throw insertError; 
            }
        }



        //Stage 2
        const validateEndpoint = kycType === "bvn" ? "/api/validateBvn" : "/api/validateNin";
        const validatePayload = kycType === "bvn" ? { bvn: kycId } : { nin: kycId };

        const { data: validationResponse } = await nibss.post(validateEndpoint, validatePayload);

        if (!validationResponse.success) {
            throw new AppError("Identity validation failed", 400);
        }

        const validation = validationResponse.data;


        //Stage 3
        req.user.kycId = kycId;
        req.user.kycType = kycType;
        req.user.dateOfBirth = dateOfBirth;
        req.user.isKycVerified = true;
        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "KYC identity registered and validated. You can now create an account.",
            data: {
                kycType,
                verified: true,
            },
        });

    } catch (error) {
        if (error.response) {
            return next(new AppError(error.response.data?.message || "NIBSS request failed", error.response.status));
        }
        next(error);
    }
};

export default {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    submitKyc
}