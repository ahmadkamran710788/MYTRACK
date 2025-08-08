// src/validators/orderValidator.ts
import Joi from 'joi';

export const orderValidationSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^(\+92|0)?[0-9]{10,11}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid Pakistani phone number',
      'any.required': 'Phone number is required'
    }),
  message: Joi.string()
    .max(500)
    .required()
    .messages({
      'string.max': 'Message cannot exceed 500 characters',
      'any.required': 'Message is required'
    }),
  selectedPackage: Joi.string()
    .valid('basic', 'standard', 'premium')
    .required()
    .messages({
      'any.only': 'Package must be basic, standard, or premium',
      'any.required': 'Package selection is required'
    })
});