import Joi from "joi";

const transferSchema = Joi.object({
    to: Joi.string()
        .length(10)
        .pattern(/^\d+$/)
        .required()
        .messages({
            "string.length": "Recipient account number must be exactly 10 digits",
            "string.pattern.base": "Recipient account number must contain only numbers",
        }),
    amount: Joi.number()
        .positive()
        .required()
        .messages({
            "number.positive": "Amount must be greater than zero",
        }),
}).options(
    {
        abortEarly: false,
        allowUnknown: false
    }
);

export default { transferSchema };