const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false
        });

        if (error) {
            const errors = {};

            error.details.forEach((details) => {
                const field = details.path.join(".");
                errors[field] = details.message;
            });

            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            })
        }

        req.body = value;
        next();
    }
}

export default validate;