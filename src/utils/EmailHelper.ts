import nodemailer from 'nodemailer';
import { IContact } from '../models/contact';
import { ICallbackRequest } from '../models/callBack';
import handlebars from 'handlebars';
import { IOrder } from '../models/order';
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




// Create transporter with better error handling and validation
const createTransporter1 = (): nodemailer.Transporter | null => {
  // Check if environment variables are set
  const email = "jhon22333332@gmail.com";
  const password ="qdah qlku dgkb ihcx";

  if (!email || !password) {
    console.error('❌ Missing email credentials. Please check NODEMAILER_EMAIL and NODEMAILER_PASS environment variables.');
    return null;
  }

  console.log('📧 Creating email transporter for:', email);

  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email,
        pass: password
      },
      secure: true,
      tls: {
        rejectUnauthorized: false
      }
    });
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    return null;
  }
};

// Initialize transporter
const transporter = createTransporter1();

// Verify transporter connection on startup
const verifyTransporter = async (): Promise<boolean> => {
  if (!transporter) {
    console.warn('⚠️ Email transporter not available');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error);
    return false;
  }
};

// Call verification immediately
verifyTransporter();

const emailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - Car Tracker Pakistan</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .email-container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            margin: -30px -30px 30px -30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .order-details {
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #4CAF50;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: bold;
            color: #555;
        }
        .detail-value {
            color: #333;
        }
        .package-features {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #ddd;
        }
        .package-features h3 {
            color: #4CAF50;
            margin-top: 0;
            font-size: 18px;
        }
        .features-list {
            list-style: none;
            padding: 0;
        }
        .features-list li {
            padding: 5px 0;
            position: relative;
            padding-left: 25px;
        }
        .features-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #4CAF50;
            font-weight: bold;
            font-size: 16px;
        }
        .contact-info {
            background-color: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .contact-info h3 {
            color: #4CAF50;
            margin-top: 0;
        }
        .phone-number {
            background-color: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            margin: 10px 0;
            transition: background-color 0.3s;
        }
        .phone-number:hover {
            background-color: #45a049;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #777;
            font-size: 14px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .price-highlight {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
        }
        .contract-number {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🚗 Order Confirmation</h1>
            <p>Car Tracker Pakistan - Your Vehicle Security Partner</p>
        </div>

        <h2>Thank you for your order!</h2>
        <p>We have received your order for our car tracking service. Our team will contact you shortly to confirm the details and schedule the installation.</p>

        <div class="contract-number">
            Contract Number: {{contractNumber}}
        </div>

        <div class="order-details">
            <h3>Order Details</h3>
            <div class="detail-row">
                <span class="detail-label">Package:</span>
                <span class="detail-value">{{packageName}}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone Number:</span>
                <span class="detail-value">{{phoneNumber}}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">{{orderDate}}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">Pending Confirmation</span>
            </div>
        </div>

        <div class="price-highlight">
            Total Amount: Rs. {{price}}
        </div>

        {{#if message}}
        <div class="order-details">
            <h3>Your Message</h3>
            <p>{{message}}</p>
        </div>
        {{/if}}

        <div class="package-features">
            <h3>{{packageName}} Package Features</h3>
            <ul class="features-list">
                {{#each features}}
                <li>{{this}}</li>
                {{/each}}
            </ul>
        </div>

        <div class="contact-info">
            <h3>Need Help?</h3>
            <p>Our customer support team is ready to assist you!</p>
            <a href="tel:+923112224877" class="phone-number">📞 0311-2224877</a>
            <p>Or email us at: info@cartrackerpakistan.com</p>
        </div>

        <div class="footer">
            <p>© 2024 Car Tracker Pakistan. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this email address.</p>
        </div>
    </div>
</body>
</html>
`;

export const sendOrderConfirmationEmail = async (order: IOrder): Promise<void> => {
  // Check if transporter is available
  if (!transporter) {
    console.warn('⚠️ Email transporter not configured. Skipping email sending.');
    return;
  }

  // Validate required environment variables
  const recipientEmail = process.env.NODEMAILER_EMAIL;
  if (!recipientEmail) {
    console.error('❌ Recipient email not configured. Please set NODEMAILER_EMAIL environment variable.');
    return;
  }

  try {
    // Register Handlebars helper for number formatting
    handlebars.registerHelper('formatPrice', function(price: number) {
      return price.toLocaleString('en-US');
    });

    const template = handlebars.compile(emailTemplate);
    
    const emailData = {
      contractNumber: order.contractNumber,
      packageName: order.packageDetails.name,
      phoneNumber: order.phoneNumber,
      orderDate: order.orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      price: order.packageDetails.price.toLocaleString('en-US'), // Format price with commas
      message: order.message || '', // Provide fallback for message
      features: order.packageDetails.features
    };

    const htmlContent = template(emailData);

    const mailOptions = {
      from: `"Car Tracker Pakistan" <${process.env.NODEMAILER_EMAIL}>`,
      to: recipientEmail,
      subject: `🚗 New Order - ${order.packageDetails.name} Package - ${order.contractNumber}`,
      html: htmlContent,
      text: `New order received for ${order.packageDetails.name} package. Contract: ${order.contractNumber}, Phone: ${order.phoneNumber}`,
      headers: {
        'X-Priority': '1', // High priority
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    console.log('📧 Sending email to:', recipientEmail);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    
  } catch (error: Error | any) {
    console.error('❌ Email sending error:', error);
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed. Please check:');
      console.error('   1. Your Gmail credentials are correct');
      console.error('   2. You have enabled "App Passwords" in your Google Account');
      console.error('   3. You are using an App Password, not your regular Gmail password');
      console.error('   4. Two-factor authentication is enabled on your Gmail account');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 Network error. Please check your internet connection.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ Connection timeout. Please try again later.');
    }
    
    throw error;
  }
};

// Export a test function to verify email configuration
export const testEmailConnection = async (): Promise<boolean> => {
  if (!transporter) {
    console.error('❌ Email transporter not available');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Email connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Email connection test failed:', error);
    return false;
  }
};