import Joi from "joi";

const postFields = {
  title: Joi.string().trim().min(1).messages({
    'string.empty': 'Title is required',
    'string.min': 'Title is required',
  }),
  desc: Joi.string().trim(),
  detail: Joi.string().trim(),
};

const splitTags = (value) =>
  String(value)
    .split(/[\s,]+/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

const normalizeTags = (value, helpers) => {
  if (value === undefined || value === null || value === '') return [];
  const list = [...new Set(splitTags(value))].slice(0, 10);
  for (const tag of list) {
    if (tag.length > 30 || !/^[a-z0-9-]+$/.test(tag)) {
      return helpers.error('any.invalid');
    }
  }
  return list;
};

const objectId = Joi.string().trim().hex().length(24).messages({
  'string.length': 'Invalid post id',
  'string.hex': 'Invalid post id',
});

const tagsValidation = Joi.any().custom(normalizeTags, 'tag normalization').default([]).messages({
  'any.invalid': 'Tags must be 1–30 chars: letters, numbers, or dashes, up to 10 tags.',
});

const statusValidation = Joi.string().valid('draft', 'published');

export const createPostSchema = Joi.object({
  title: postFields.title.required(),
  desc: Joi.string().trim().when('status', {
    is: 'draft',
    then: Joi.allow('').optional(),
    otherwise: Joi.required().messages({
      'any.required': 'Description is required',
      'string.empty': 'Description is required',
    }),
  }),
  detail: Joi.string().trim().when('status', {
    is: 'draft',
    then: Joi.allow('').optional(),
    otherwise: Joi.required().messages({
      'any.required': 'Details are required',
      'string.empty': 'Details are required',
    }),
  }),
  tags: tagsValidation,
  status: statusValidation.default('published'),
  draftId: objectId.optional(),
}).required().messages({
  'object.base': 'Title is required',
  'any.required': 'Title is required',
});

export const updatePostSchema = Joi.object({
  ...postFields,
  tags: Joi.any().custom(normalizeTags, 'tag normalization').messages({
    'any.invalid': 'Tags must be 1–30 chars: letters, numbers, or dashes, up to 10 tags.',
  }),
  status: statusValidation,
});

export const draftPostSchema = Joi.object({
  title: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Title is required to save a draft',
    'string.min': 'Title is required to save a draft',
    'any.required': 'Title is required to save a draft',
  }),
  desc: Joi.string().trim().allow('').optional(),
  detail: Joi.string().trim().allow('').optional(),
  tags: tagsValidation,
  draftId: objectId.optional(),
});