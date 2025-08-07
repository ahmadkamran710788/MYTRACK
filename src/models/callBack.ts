// models/CallbackRequest.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ICallbackRequest extends Document {
  name: string;
  phoneNumber: string;
  selectedService: 'Car Tracking' | 'Bike Tracking' | 'Fleet Management';
  message?: string;
  status: 'pending' | 'called' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  preferredCallTime?: string;
  callAttempts: number;
  lastCallAttempt?: Date;
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CallbackRequestSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  selectedService: {
    type: String,
    required: [true, 'Please select a service'],
    enum: {
      values: ['Car Tracking', 'Bike Tracking', 'Fleet Management'],
      message: 'Please select a valid service'
    }
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'called', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  preferredCallTime: {
    type: String,
    trim: true
  },
  callAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  lastCallAttempt: {
    type: Date
  },
  assignedTo: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
CallbackRequestSchema.index({ status: 1, createdAt: -1 });
CallbackRequestSchema.index({ phoneNumber: 1 });
CallbackRequestSchema.index({ selectedService: 1 });
CallbackRequestSchema.index({ priority: 1, status: 1 });
CallbackRequestSchema.index({ assignedTo: 1, status: 1 });

// Virtual for formatted phone display
CallbackRequestSchema.virtual('formattedPhone').get(function(this: ICallbackRequest) {
  if (this.phoneNumber.startsWith('+')) {
    return this.phoneNumber;
  }
  return `+${this.phoneNumber}`;
});

export default mongoose.model<ICallbackRequest>('CallbackRequest', CallbackRequestSchema);