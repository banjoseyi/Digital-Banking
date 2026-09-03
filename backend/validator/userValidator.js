import Joi from "joi";

const registerSchema = Joi.object(
    {
        firstName: Joi.string()
            .trim()
            .min(2)
            .max(30)
            .required()
            .messages({
                "string.base": "First name must be text",
                "string.empty": "First name is required",
                "string.min": "First name must contain at least 2 characters",
                "string.max": "First name cannot exceed 30 characters",
                "any.required": "First name is required",
            }),
        lastName: Joi.string()
            .trim()
            .min(2)
            .max(30)
            .required()
            .messages({
                "string.base": "Last name must be text",
                "string.empty": "Last name is required",
                "string.min": "Last name must contain at least 2 characters",
                "string.max": "Last name cannot exceed 30 characters",
                "any.required": "Last name is required",
            }),

        email: Joi.string()
            .trim()
            .lowercase()
            .email()
            .required()
            .messages({
                "string.base": "Email must be text",
                "string.empty": "Email is required",
                "string.email": "Please provide a valid email address",
                "any.required": "Email is required",
            }),

        password: Joi.string()
            .min(8)
            .max(128)
            .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
            .required()
            .messages({
                "string.empty": "Password is required",
                "string.min": "Password must contain at least 8 characters",
                "string.max": "Password cannot exceed 128 characters",
                "string.pattern.base": "Password must contain at least one letter and one number",
                "any.required": "Password is required",
            }),
    }
).options({
    abortEarly: false,
    allowUnknown: false,
});

const loginSchema = Joi.object(
    {
        email: Joi.string()
            .trim()
            .lowercase()
            .email()
            .required(),

        password: Joi.string()
            .required(),
    }
).options({
    abortEarly: false,
    allowUnknown: false,
});


export default {
    registerSchema,
    loginSchema
}