import Joi from "joi";

const postFields = {
  title: Joi.string().trim().min(1).messages({
    'string.empty': 'Title is required',
    'string.min': 'Title is required',
  }),
  desc: Joi.string().trim().min(1).messages({
    'string.empty': 'Description is required',
    'string.min': 'Description is required',
  }),
  detail: Joi.string().trim().min(1).messages({
    'string.empty': 'Details are required',
    'string.min': 'Details are required',
  }),
};

export const createPostSchema = Joi.object({
  ...postFields,
}).required().messages({
  'object.base': 'Title is required',
  'any.required': 'Title is required',
});

export const updatePostSchema = Joi.object({
  ...postFields,
});