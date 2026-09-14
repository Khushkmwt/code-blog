import Joi from "joi";

export const updateBioSchema = Joi.object({
    bio: Joi.string().trim().max(160).optional(),
});