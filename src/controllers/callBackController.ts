// controllers/callbackController.ts
import { Request, Response } from 'express';
import CallbackRequest, { ICallbackRequest } from '../models/callBack';
import { sendCallbackEmails } from '../utils/EmailHelper';
import { validationResult } from 'express-validator';

// Create new callback request
export const createCallbackRequest = async (req: Request, res: Response): Promise<void> => {
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

    const { name, phoneNumber, selectedService, message } = req.body;

    // Check for recent duplicate requests (within last hour)
    const recentRequest = await CallbackRequest.findOne({
      phoneNumber,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    if (recentRequest) {
      res.status(409).json({
        success: false,
        message: 'A callback request from this number was already submitted recently. Please wait before submitting another request.'
      });
      return;
    }

    // Determine priority based on service type and message content
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (selectedService === 'Fleet Management') {
      priority = 'high';
    } else if (message && (message.toLowerCase().includes('urgent') || message.toLowerCase().includes('asap'))) {
      priority = 'high';
    }

    // Create new callback request
    const callbackRequest: ICallbackRequest = new CallbackRequest({
      name,
      phoneNumber,
      selectedService,
      message,
      priority
    });

    // Save to database
    const savedRequest = await callbackRequest.save();

    // Send email notifications (non-blocking)
    sendCallbackEmails(savedRequest)
  .catch((error: Error) => {
    console.error('Email notification failed:', error);
  });


    res.status(201).json({
      success: true,
      message: 'Callback request submitted successfully. We will contact you soon!',
      data: {
        requestId: savedRequest._id,
        name: savedRequest.name,
        selectedService: savedRequest.selectedService,
        status: savedRequest.status,
        priority: savedRequest.priority,
        createdAt: savedRequest.createdAt,
        estimatedCallTime: getEstimatedCallTime(savedRequest.priority)
      }
    });

  } catch (error: any) {
    console.error('Error creating callback request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all callback requests with filtering and pagination
export const getAllCallbackRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.service) filter.selectedService = req.query.service;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    // Date range filtering
    if (req.query.fromDate || req.query.toDate) {
      filter.createdAt = {};
      if (req.query.fromDate) filter.createdAt.$gte = new Date(req.query.fromDate as string);
      if (req.query.toDate) filter.createdAt.$lte = new Date(req.query.toDate as string);
    }

    const requests = await CallbackRequest.find(filter)
      .sort({ priority: -1, createdAt: -1 }) // High priority first, then newest
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await CallbackRequest.countDocuments(filter);

    // Get status counts for dashboard
    const statusCounts = await CallbackRequest.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Callback requests retrieved successfully',
      data: {
        requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRequests: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        statusCounts: statusCounts.reduce((acc: Record<string, number>, item : { _id: string; count: number }) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error: any) {
    console.error('Error fetching callback requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get callback request by ID
export const getCallbackRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const request = await CallbackRequest.findById(id);

    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Callback request not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Callback request retrieved successfully',
      data: request
    });

  } catch (error: any) {
    console.error('Error fetching callback request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update callback request status/details
export const updateCallbackRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Only allow certain fields to be updated
    const allowedUpdates = ['status', 'priority', 'assignedTo', 'notes', 'preferredCallTime'];
    const updateData: any = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // If status is being changed to 'called', increment call attempts
    if (updates.status === 'called') {
      updateData.$inc = { callAttempts: 1 };
      updateData.lastCallAttempt = new Date();
    }

    const updatedRequest = await CallbackRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      res.status(404).json({
        success: false,
        message: 'Callback request not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Callback request updated successfully',
      data: updatedRequest
    });

  } catch (error: any) {
    console.error('Error updating callback request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete callback request
export const deleteCallbackRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const request = await CallbackRequest.findByIdAndDelete(id);

    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Callback request not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Callback request deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting callback request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get dashboard statistics
export const getCallbackStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayStats,
      weekStats,
      monthStats,
      serviceStats,
      priorityStats
    ] = await Promise.all([
      // Today's stats
      CallbackRequest.aggregate([
        { $match: { createdAt: { $gte: startOfDay } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // This week's stats
      CallbackRequest.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // This month's stats
      CallbackRequest.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Service breakdown
      CallbackRequest.aggregate([
        { $group: { _id: '$selectedService', count: { $sum: 1 } } }
      ]),
      // Priority breakdown
      CallbackRequest.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      message: 'Callback statistics retrieved successfully',
      data: {
        today: formatStatsArray(todayStats),
        thisWeek: formatStatsArray(weekStats),
        thisMonth: formatStatsArray(monthStats),
        byService: formatStatsArray(serviceStats),
        byPriority: formatStatsArray(priorityStats)
      }
    });

  } catch (error: any) {
    console.error('Error fetching callback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to get estimated call time based on priority
const getEstimatedCallTime = (priority: string): string => {
  switch (priority) {
    case 'high':
      return 'Within 2 hours';
    case 'medium':
      return 'Within 24 hours';
    case 'low':
      return 'Within 48 hours';
    default:
      return 'Within 24 hours';
  }
};

// Helper function to format stats array
const formatStatsArray = (statsArray: any[]): Record<string, number> => {
  return statsArray.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {} as Record<string, number>);
};