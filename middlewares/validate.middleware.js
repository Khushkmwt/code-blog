import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
    if (!schema) return next();

    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const first = error.details[0];
        return next(new ApiError(400, first.message.replace(/^"|"$/g, '')));
    }

    req.body = value;
    return next();
};