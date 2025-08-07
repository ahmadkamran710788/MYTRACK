import nodemailer from 'nodemailer';
import { IContact } from '../models/contact';
import { ICallbackRequest } from '../models/callBack';
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

//call back 
// Generate callback request notification template
const generateCallbackNotificationTemplate = (callback: ICallbackRequest): string => {
  const urgencyColor = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
  };

  const urgencyIcon = {
    low: '🟢',
    medium: '🟡',
    high: '🔴'
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Callback Request</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 650px; 
          margin: 0 auto; 
          background-color: #ffffff;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content { 
          padding: 30px 20px; 
        }
        .priority-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background-color: ${urgencyColor[callback.priority]};
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .info-grid {
          display: grid;
          gap: 20px;
          margin-bottom: 25px;
        }
        .field { 
          background-color: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .label { 
          font-weight: 600; 
          color: #374151;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .value { 
          font-size: 16px;
          color: #111827;
        }
        .service-badge { 
          display: inline-block; 
          background: linear-gradient(45deg, #4ade80, #22c55e);
          color: white; 
          padding: 8px 16px; 
          border-radius: 25px; 
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .message-box {
          background-color: #f0f9ff;
          border: 1px solid #e0f2fe;
          border-radius: 8px;
          padding: 15px;
          font-style: italic;
          color: #0369a1;
        }
        .action-buttons {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #f1f5f9;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          margin: 0 10px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }
        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }
        .footer {
          background-color: #f8fafc;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📞 New Callback Request</h2>
        </div>
        
        <div class="content">
          <div class="priority-badge">
            ${urgencyIcon[callback.priority]} ${callback.priority.toUpperCase()} PRIORITY
          </div>
          
          <div class="info-grid">
            <div class="field">
              <div class="label">Customer Name</div>
              <div class="value">${callback.name}</div>
            </div>
            
            <div class="field">
              <div class="label">Phone Number</div>
              <div class="value">
                <a href="tel:${callback.phoneNumber}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">
                  ${callback.phoneNumber}
                </a>
              </div>
            </div>
            
            <div class="field">
              <div class="label">Requested Service</div>
              <div class="value">
                <span class="service-badge">${callback.selectedService}</span>
              </div>
            </div>
            
            ${callback.message ? `
            <div class="field">
              <div class="label">Customer Message</div>
              <div class="message-box">${callback.message}</div>
            </div>
            ` : ''}
            
            <div class="field">
              <div class="label">Request Submitted</div>
              <div class="value">${callback.createdAt.toLocaleString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
          </div>
          
          <div class="action-buttons">
            <a href="tel:${callback.phoneNumber}" class="btn btn-primary">
              📞 Call Now
            </a>
            <a href="${process.env.ADMIN_DASHBOARD_URL || '#'}/callbacks/${callback._id}" class="btn btn-secondary">
              📋 View Details
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Tracking Services</strong> - Customer Callback Management</p>
          <p>This is an automated notification. Please respond promptly to maintain excellent customer service.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate customer confirmation template
const generateCustomerConfirmationTemplate = (callback: ICallbackRequest): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Callback Request Received</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .content { 
          padding: 30px 20px; 
        }
        .highlight {
          background: linear-gradient(45deg, #4ade80, #22c55e);
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        .service-info {
          background-color: #f0f9ff;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #3b82f6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>✅ Callback Request Received</h2>
        </div>
        
        <div class="content">
          <p><strong>Dear ${callback.name},</strong></p>
          
          <p>Thank you for requesting a callback regarding our <strong>${callback.selectedService}</strong> service.</p>
          
          <div class="highlight">
            <h3 style="margin: 0;">We'll call you within 24 hours!</h3>
          </div>
          
          <div class="service-info">
            <h4 style="color: #3b82f6; margin-top: 0;">Your Request Details:</h4>
            <p><strong>Service:</strong> ${callback.selectedService}</p>
            <p><strong>Phone:</strong> ${callback.phoneNumber}</p>
            <p><strong>Request ID:</strong> #${(callback._id as any).toString().slice(-8).toUpperCase()}</p>
            ${callback.message ? `<p><strong>Your Message:</strong> "${callback.message}"</p>` : ''}
          </div>
          
          <p>Our team is reviewing your request and will contact you soon to discuss your ${callback.selectedService} needs.</p>
          
          <p>If you need immediate assistance, please call us at <strong>${process.env.SUPPORT_PHONE || '+1-800-TRACKING'}</strong></p>
          
          <p>Best regards,<br><strong>Tracking Services Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send callback request notification to admin/sales team
export const sendCallbackNotification = async (callback: ICallbackRequest): Promise<void> => {
  try {
    const transporter = createTransporter();
    
   const mailOptions = {
  from: process.env.NODEMAILER_EMAIL,
  to: process.env.SALES_EMAIL || process.env.NOTIFICATION_EMAIL || process.env.NODEMAILER_EMAIL,
  subject: `🚨 ${callback.priority.toUpperCase()} Priority - New Callback Request: ${callback.selectedService}`,
  html: generateCallbackNotificationTemplate(callback),
  priority: callback.priority === 'high' ? 'high' as 'high' : 'normal' as 'normal'
};

    await transporter.sendMail(mailOptions);
    console.log(`Callback notification sent successfully for: ${callback.name} (${callback.phoneNumber})`);
  } catch (error) {
    console.error('Callback notification failed:', error);
    throw new Error('Failed to send callback notification');
  }
};

// Send confirmation to customer (if email provided)
export const sendCustomerConfirmation = async (callback: ICallbackRequest, customerEmail?: string): Promise<void> => {
  if (!customerEmail) {
    console.log('No customer email provided for confirmation');
    return;
  }

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: customerEmail,
      subject: 'Callback Request Received - We\'ll Contact You Soon!',
      html: generateCustomerConfirmationTemplate(callback)
    };

    await transporter.sendMail(mailOptions);
    console.log(`Customer confirmation sent to: ${customerEmail}`);
  } catch (error) {
    console.error('Customer confirmation email failed:', error);
    // Don't throw error for confirmation email failure
  }
};

// Send both notification and confirmation emails
export const sendCallbackEmails = async (callback: ICallbackRequest): Promise<void> => {
  await Promise.allSettled([
    sendCallbackNotification(callback)
  ]);
};