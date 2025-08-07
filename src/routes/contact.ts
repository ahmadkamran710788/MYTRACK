// routes/contactRoutes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { 
  createContact, 
  getAllContacts, 
  getContactById, 
  getContactsByPlan, 
  deleteContact 
} from '../controllers/contactController';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for contact submissions
const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    success: false,
    message: 'Too many contact submissions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const contactValidation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name should only contain letters and spaces'),

  body('phoneNumber')
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),

  body('selectedPlan')
    .isIn(['Car Tracking', 'Bike Tracking', 'Fleet Management'])
    .withMessage('Please select a valid plan'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
];

// Public routes
/**
 * POST /api/contacts
 * Create new contact inquiry
 * @body {string} fullName - Customer's full name
 * @body {string} phoneNumber - Customer's phone number
 * @body {string} selectedPlan - Selected tracking plan
 * @body {string} [message] - Optional message
 */
router.post('/', contactRateLimit, contactValidation, createContact);

// Admin routes (you may want to add authentication middleware here)
/**
 * GET /api/contacts
 * Get all contacts with pagination
 * @query {number} [page=1] - Page number
 * @query {number} [limit=10] - Items per page
 */
router.get('/', getAllContacts);

/**
 * GET /api/contacts/:id
 * Get contact by ID
 * @param {string} id - Contact ID
 */
router.get('/:id', getContactById);

/**
 * GET /api/contacts/plan/:plan
 * Get contacts by plan type
 * @param {string} plan - Plan type (Car Tracking, Bike Tracking, Fleet Management)
 */
router.get('/plan/:plan', getContactsByPlan);

/**
 * DELETE /api/contacts/:id
 * Delete contact by ID (admin only)
 * @param {string} id - Contact ID
 */
router.delete('/:id', deleteContact);

export default router;