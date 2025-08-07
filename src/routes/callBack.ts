// routes/callbackRoutes.ts
import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  createCallbackRequest,
  getAllCallbackRequests,
  getCallbackRequestById,
  updateCallbackRequest,
  deleteCallbackRequest,
  getCallbackStats
} from '../controllers/callBackController';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for callback requests
const callbackRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2, // Limit each IP to 2 callback requests per windowMs
  message: {
    success: false,
    message: 'Too many callback requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware for creating callback requests
const callbackValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name should only contain letters and spaces'),

  body('phoneNumber')
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),

  body('selectedService')
    .isIn(['Car Tracking', 'Bike Tracking', 'Fleet Management'])
    .withMessage('Please select a valid service'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
];

// Validation for admin route filters
const adminQueryValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'called', 'completed', 'cancelled'])
    .withMessage('Invalid status filter'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority filter'),

  query('service')
    .optional()
    .isIn(['Car Tracking', 'Bike Tracking', 'Fleet Management'])
    .withMessage('Invalid service filter'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Update validation
const updateValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'called', 'completed', 'cancelled'])
    .withMessage('Invalid status'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority'),

  body('assignedTo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Assigned to cannot exceed 100 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters')
];

// PUBLIC ROUTES

/**
 * POST /api/callbacks
 * Submit a new callback request
 * @body {string} name - Customer's name
 * @body {string} phoneNumber - Customer's phone number
 * @body {string} selectedService - Selected service type
 * @body {string} [message] - Optional message from customer
 */
router.post('/', callbackRateLimit, callbackValidation, createCallbackRequest);

// ADMIN ROUTES (add authentication middleware here as needed)

/**
 * GET /api/callbacks
 * Get all callback requests with filtering and pagination
 * @query {string} [status] - Filter by status (pending, called, completed, cancelled)
 * @query {string} [priority] - Filter by priority (low, medium, high)
 * @query {string} [service] - Filter by service type
 * @query {string} [assignedTo] - Filter by assigned person
 * @query {string} [fromDate] - Filter from date (ISO string)
 * @query {string} [toDate] - Filter to date (ISO string)
 * @query {number} [page=1] - Page number
 * @query {number} [limit=10] - Items per page
 */
router.get('/', adminQueryValidation, getAllCallbackRequests);

/**
 * GET /api/callbacks/stats
 * Get dashboard statistics for callback requests
 */
router.get('/stats', getCallbackStats);

/**
 * GET /api/callbacks/:id
 * Get specific callback request by ID
 * @param {string} id - Callback request ID
 */
router.get('/:id', getCallbackRequestById);

/**
 * PUT /api/callbacks/:id
 * Update callback request status and details
 * @param {string} id - Callback request ID
 * @body {string} [status] - New status
 * @body {string} [priority] - New priority
 * @body {string} [assignedTo] - Assign to person
 * @body {string} [notes] - Add notes
 */
router.put('/:id', updateValidation, updateCallbackRequest);

/**
 * DELETE /api/callbacks/:id
 * Delete callback request
 * @param {string} id - Callback request ID
 */
router.delete('/:id', deleteCallbackRequest);

export default router;