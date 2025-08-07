import nodemailer from 'nodemailer';
import { IContact } from '../models/contact';

// Create email transporter
const createTransporter = (): nodemailer.Transporter => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASS
    },
    secure: true,
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Generate notification email template
const generateNotificationTemplate = (contact: IContact): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Inquiry</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b4cb8; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #3b4cb8; }
        .value { margin-top: 5px; }
        .plan-badge { 
          display: inline-block; 
          background-color: #4ade80; 
          color: white; 
          padding: 5px 15px; 
          border-radius: 20px; 
          font-size: 14px;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚗 New Tracking Service Inquiry</h2>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Full Name:</div>
            <div class="value">${contact.fullName}</div>
          </div>
          
          <div class="field">
            <div class="label">Phone Number:</div>
            <div class="value">${contact.phoneNumber}</div>
          </div>
          
          <div class="field">
            <div class="label">Selected Plan:</div>
            <div class="value">
              <span class="plan-badge">${contact.selectedPlan}</span>
            </div>
          </div>
          
          ${contact.message ? `
          <div class="field">
            <div class="label">Message:</div>
            <div class="value">${contact.message}</div>
          </div>
          ` : ''}
          
          <div class="field">
            <div class="label">Submitted At:</div>
            <div class="value">${contact.createdAt.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate confirmation email template
const generateConfirmationTemplate = (contact: IContact): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #3b4cb8; color: white; padding: 20px; text-align: center;">
          <h2>Thank You for Your Interest!</h2>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px;">
          <p>Dear ${contact.fullName},</p>
          <p>Thank you for your interest in our <strong>${contact.selectedPlan}</strong> service.</p>
          <p>We have received your inquiry and our team will contact you shortly at ${contact.phoneNumber}.</p>
          <p>Best regards,<br>Tracking Services Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send notification email to admin
export const sendContactNotification = async (contact: IContact): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: process.env.NOTIFICATION_EMAIL || process.env.NODEMAILER_EMAIL,
      subject: `New ${contact.selectedPlan} Inquiry - Contact Form`,
      html: generateNotificationTemplate(contact)
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email notification sent successfully for contact: ${contact.fullName}`);
  } catch (error) {
    console.error('Email notification failed:', error);
    throw new Error('Failed to send email notification');
  }
};

// Send confirmation email to customer
export const sendConfirmationEmail = async (contact: IContact): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: contact.phoneNumber, // You might want to add email field to contact
      subject: 'Thank you for your interest in our tracking services',
      html: generateConfirmationTemplate(contact)
    };

    // Only send if we have a valid email address
    // For now, we'll skip this or you can modify to include email field
    console.log('Confirmation email would be sent to customer');
  } catch (error) {
    console.error('Confirmation email failed:', error);
    // Don't throw error for confirmation email failure
  }
};

// Send both notification and confirmation emails
export const sendEmailNotifications = async (contact: IContact): Promise<void> => {
  await Promise.allSettled([
    sendContactNotification(contact),
    sendConfirmationEmail(contact)
  ]);
};