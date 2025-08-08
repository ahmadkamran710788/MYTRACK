import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  phoneNumber: string;
  message: string;
  selectedPackage: 'basic' | 'standard' | 'premium';
  packageDetails: {
    name: string;
    price: number;
    features: string[];
  };
  orderDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  contractNumber: string;
}

const OrderSchema: Schema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    match: [/^(\+92|0)?[0-9]{10,11}$/, 'Please enter a valid Pakistani phone number']
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  selectedPackage: {
    type: String,
    required: true,
    enum: ['basic', 'standard', 'premium']
  },
  packageDetails: {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    features: [{
      type: String
    }]
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  contractNumber: {
    type: String,
    unique: true,
    required: true
  }
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
