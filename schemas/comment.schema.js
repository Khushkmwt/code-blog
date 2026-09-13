import Joi from "joi";

export const createCommentSchema = Joi.object({
  comment: Joi.string().trim().min(1).required().messages({
    'any.required': 'Comment is required',
    'string.empty': 'Comment is required',
    'string.min': 'Comment is required',
  }),
});