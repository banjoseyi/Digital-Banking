import User from "../model/User.js";
import AppError from "../utils/AppError.js";



const registerUser = async (req, res) => {
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



const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;



    } catch (error) {
        next(error);
    }
}

export default {
    registerUser,
    loginUser
}