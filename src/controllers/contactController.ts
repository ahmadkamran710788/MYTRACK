// controllers/contactController.ts
import { Request, Response } from 'express';
import Contact, { IContact } from '../models/contact';
import { sendEmailNotifications } from '../utils/EmailHelper';
import { validationResult } from 'express-validator';

// Create new contact inquiry
export const createContact = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { fullName, phoneNumber, selectedPlan, message } = req.body;

    // Create new contact
    const contact: IContact = new Contact({
      fullName,
      phoneNumber,
      selectedPlan,
      message
    });

    // Save to database
    const savedContact = await contact.save();

    // Send email notifications (non-blocking)
    sendEmailNotifications(savedContact)
      .catch(error => {
        console.error('Email notification failed:', error);
      });

    res.status(201).json({
      success: true,
      message: 'Contact inquiry submitted successfully',
      data: {
        id: savedContact._id,
        fullName: savedContact.fullName,
        selectedPlan: savedContact.selectedPlan,
        createdAt: savedContact.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all contacts with pagination
export const getAllContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Contact.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Contacts retrieved successfully',
      data: {
        contacts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalContacts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get contact by ID
export const getContactById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Contact retrieved successfully',
      data: contact
    });

  } catch (error: any) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get contacts by plan type
export const getContactsByPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan } = req.params;
    const validPlans = ['Car Tracking', 'Bike Tracking', 'Fleet Management'];

    if (!validPlans.includes(plan)) {
      res.status(400).json({
        success: false,
        message: 'Invalid plan type'
      });
      return;
    }

    const contacts = await Contact.find({ selectedPlan: plan })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: `Contacts for ${plan} retrieved successfully`,
      data: {
        plan,
        count: contacts.length,
        contacts
      }
    });

  } catch (error: any) {
    console.error('Error fetching contacts by plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete contact by ID
export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};