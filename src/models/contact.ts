import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  fullName: string;
  phoneNumber: string;
  selectedPlan: 'Car Tracking' | 'Bike Tracking' | 'Fleet Management';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  selectedPlan: {
    type: String,
    required: [true, 'Please select a plan'],
    enum: {
      values: ['Car Tracking', 'Bike Tracking', 'Fleet Management'],
      message: 'Please select a valid plan'
    }
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Index for efficient querying
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ selectedPlan: 1 });

export default mongoose.model<IContact>('Contact', ContactSchema);