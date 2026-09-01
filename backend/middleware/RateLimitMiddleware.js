import rateLimit from "express-rate-limit";

const createLimiter = ({ windowMs, limit, message }) => {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,

        handler: (req, res) => {
            return res.status(429).json({
                success: false,
                code: "TOO_MANY_REQUESTS",
                message,
            });
        },
    });
};

const registerLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: "Too many registration attempts. Please try again later.",
});

const loginLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: "Too many login attempts. Please try again later.",
});

export default {
    registerLimiter,
    loginLimiter,
};