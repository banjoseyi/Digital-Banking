import Joi from "joi";

const kycSchema = Joi.object({
    kycType: Joi.string()
        .valid("bvn", "nin")
        .required(),
    kycId: Joi.string()
        .length(11)
        .pattern(/^\d+$/)
        .required()
        .messages({
            "string.length": "{{#label}} must be exactly 11 digits",
            "string.pattern.base": "{{#label}} must contain only numbers",
        }),
    firstName: Joi.string()
        .trim()
        .required(),
    lastName: Joi.string()
        .trim()
        .required(),
    dateOfBirth: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required()
        .messages({
            "string.pattern.base": "dateOfBirth must be in YYYY-MM-DD format",
        }),
    phone: Joi.string()
        .when("kycType", {
            is: "bvn",
            then: Joi.required(),
            otherwise: Joi.optional(),
        }),
}).options({
    abortEarly: false,
    allowUnknown: false
});

export default { kycSchema };