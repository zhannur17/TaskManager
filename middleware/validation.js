const Joi = require('joi');

// Validation schemas
const schemas = {
  // User registration validation
  userRegister: Joi.object({
    username: Joi.string().min(3).max(30).required().messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
  }),

  // User login validation
  userLogin: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),

  // User profile update validation
  userUpdate: Joi.object({
    username: Joi.string().min(3).max(30).messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
    }),
    email: Joi.string().email().messages({
      'string.email': 'Please provide a valid email address',
    }),
  }).min(1),

  // Task creation validation
  taskCreate: Joi.object({
    title: Joi.string().max(100).required().messages({
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Task title is required',
    }),
    description: Joi.string().max(500).allow('').messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
    dueDate: Joi.date().iso().required().messages({
      'date.base': 'Please provide a valid date',
      'any.required': 'Due date is required',
    }),
    priority: Joi.string().valid('low', 'medium', 'high').messages({
      'any.only': 'Priority must be low, medium, or high',
    }),
  }),

  // Task update validation
  taskUpdate: Joi.object({
    title: Joi.string().max(100).messages({
      'string.max': 'Title cannot exceed 100 characters',
    }),
    description: Joi.string().max(500).allow('').messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
    status: Joi.boolean(),
    dueDate: Joi.date().iso().messages({
      'date.base': 'Please provide a valid date',
    }),
    priority: Joi.string().valid('low', 'medium', 'high').messages({
      'any.only': 'Priority must be low, medium, or high',
    }),
  }).min(1),
};

// Middleware function to validate request body
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Validation schema not found',
      });
    }

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    next();
  };
};

module.exports = { validate };