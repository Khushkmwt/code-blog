import Joi from "joi";

const M = {
  'any.required': 'required',
  'string.empty': 'required',
  'string.min': 'required',
  'string.email': 'A valid email is required',
};

const msg = (label) => (label + ' is required');

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(80).required().messages({
    'any.required': msg('Name'),
    'string.empty': msg('Name'),
    'string.min': msg('Name'),
  }),
  email: Joi.string().trim().email().required().messages({
    'any.required': 'A valid email is required',
    'string.empty': 'A valid email is required',
    'string.email': 'A valid email is required',
    'string.min': 'A valid email is required',
  }),
  username: Joi.string().trim().pattern(/^[a-zA-Z0-9_]{2,20}$/).required().messages({
    'any.required': 'Username must be 2-20 characters (letters, numbers, underscore)',
    'string.empty': 'Username must be 2-20 characters (letters, numbers, underscore)',
    'string.pattern.base': 'Username must be 2-20 characters (letters, numbers, underscore)',
  }),
  password: Joi.string().min(6).required().messages({
    'any.required': 'Password must be at least 6 characters',
    'string.empty': 'Password must be at least 6 characters',
    'string.min': 'Password must be at least 6 characters',
  }),
});

export const loginSchema = Joi.object({
  identifier: Joi.string().trim(),
  email: Joi.string().trim(),
  username: Joi.string().trim(),
  password: Joi.string().required(),
}).or('identifier', 'email', 'username')
  .messages({
    'object.missing': 'Email or username is required',
    'any.required': '{{#label}} is required',
    'string.empty': '{{#label}} is required',
  });

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required().messages({
    'any.required': 'New password must be at least 6 characters',
    'string.empty': 'New password must be at least 6 characters',
    'string.min': 'New password must be at least 6 characters',
  }),
});