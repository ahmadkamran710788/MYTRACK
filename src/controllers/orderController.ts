// src/controllers/orderController.ts
import { Request, Response } from 'express';
import { Order } from '../models/order';
import { sendOrderConfirmationEmail } from '../utils/EmailHelper';
import { generateContractNumber } from '../utils/contactGenerator';
import { orderValidationSchema } from '../utils/orderValidation';

const PACKAGE_DETAILS = {
  basic: {
    name: 'Basic',
    price: 14000,
    features: [
      '24/7 Control Room Monitoring',
      'Real-time tracking',
      'Geofencing Tracking',
      'Web Access Portal',
      'Mobile App (iOS/Android)',
      'Share Track Via Web & Mobile App',
      'Command Geo Fencing Call',
      'Customized Geo Fencing Call',
      'Battery Tempering Call',
      'Battery Voltage Alert via App'
    ]
  },
  standard: {
    name: 'Standard',
    price: 21000,
    features: [
      '24/7 Control Room Monitoring',
      'Real-time tracking',
      'Geofencing Tracking',
      'Web Access Portal',
      'Mobile App (iOS/Android)',
      'Share Track Via Web & Mobile App',
      'Command Geo Fencing Call',
      'Customized Geo Fencing Call',
      'Battery Tempering Call',
      'Battery Voltage Alert via App',
      'SOS Class Distance Alerts via App',
      'Ignition ON/OFF Alerts via App'
    ]
  },
  premium: {
    name: 'Premium',
    price: 28000,
    features: [
      '24/7 Control Room Monitoring',
      'Real-time tracking',
      'Geofencing Tracking',
      'Web Access Portal',
      'Mobile App (iOS/Android)',
      'Share Track Via Web & Mobile App',
      'Command Geo Fencing Call',
      'Customized Geo Fencing Call',
      'Battery Tempering Call',
      'Battery Voltage Alert via App',
      'SOS Class Distance Alerts via App',
      'Ignition ON/OFF Alerts via App',
      'Multi-Layer Maps',
      'Periodic Maintenance',
      'Custom on Demand',
      'Assistance in Their Case'
    ]
  }
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request data
    const { error, value } = orderValidationSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details
      });
      return;
    }

    const { phoneNumber, message, selectedPackage } = value;

    // Get package details
    const packageDetails = PACKAGE_DETAILS[selectedPackage as keyof typeof PACKAGE_DETAILS];

    // Generate contract number
    const contractNumber = generateContractNumber();

    // Create order
    const order = new Order({
      phoneNumber,
      message,
      selectedPackage,
      packageDetails,
      contractNumber
    });

    await order.save();

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(order);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order._id,
        contractNumber: order.contractNumber,
        packageName: packageDetails.name,
        price: packageDetails.price
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 });
    
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};