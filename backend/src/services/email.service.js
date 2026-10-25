const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.ZOHO_MAIL_HOST || 'smtp.zoho.in',
      port: process.env.ZOHO_MAIL_PORT || 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_MAIL_USER,
        pass: process.env.ZOHO_MAIL_PASSWORD
      }
    });
  }

  // Send OTP email
  async sendOTPEmail(email, otp) {
    const mailOptions = {
      from: process.env.ZOHO_MAIL_FROM || 'noreply@hometution.com',
      to: email,
      subject: 'Your Home & Online Tutor Hub OTP',
      html: `
        <h2>Welcome to Home & Online Tutor Hub</h2>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 10 minutes.</p>
        <p>Do not share this with anyone.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}`);
    } catch (error) {
      console.error('Email error:', error.message);
      throw error;
    }
  }

  // Send lead offer to tutor
  async sendLeadOfferEmail(tutorEmail, tutorName, leadData, expiryTime) {
    const mailOptions = {
      from: process.env.ZOHO_MAIL_FROM || 'noreply@hometution.com',
      to: tutorEmail,
      subject: 'New Lead: ' + leadData.class + ' ' + leadData.subjects[0],
      html: `
        <h2>New Lead Offer</h2>
        <p>Hi ${tutorName},</p>
        <p>A new tuition lead matching your profile is available:</p>
        <ul>
          <li><strong>Class:</strong> ${leadData.class}</li>
          <li><strong>Board:</strong> ${leadData.board}</li>
          <li><strong>Subject:</strong> ${leadData.subjects.join(', ')}</li>
          <li><strong>Mode:</strong> ${leadData.mode}</li>
          <li><strong>Preferred Days:</strong> ${leadData.preferred_days.join(', ')}</li>
          <li><strong>Budget:</strong> ₹${leadData.budget}</li>
        </ul>
        <p><strong>Accept or reject this lead by ${expiryTime.toLocaleString()}</strong></p>
        <p><a href="${process.env.APP_URL}/tutor/leads">View Lead</a></p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Lead offer sent to ${tutorEmail}`);
    } catch (error) {
      console.error('Email error:', error.message);
      throw error;
    }
  }

  // Send demo scheduled email
  async sendDemoScheduledEmail(recipientEmail, demoData) {
    const mailOptions = {
      from: process.env.ZOHO_MAIL_FROM || 'noreply@hometution.com',
      to: recipientEmail,
      subject: 'Demo Scheduled - Home & Online Tutor Hub',
      html: `
        <h2>Demo Scheduled</h2>
        <p>Your tuition demo is scheduled for:</p>
        <ul>
          <li><strong>Date & Time:</strong> ${demoData.scheduledAt.toLocaleString()}</li>
          <li><strong>Tutor:</strong> ${demoData.tutorName}</li>
          <li><strong>Subject:</strong> ${demoData.subject}</li>
        </ul>
        <p>Make sure you're available at the scheduled time.</p>
        <p><a href="${process.env.APP_URL}/demo/${demoData.demoId}">View Details</a></p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Demo scheduled email sent to ${recipientEmail}`);
    } catch (error) {
      console.error('Email error:', error.message);
    }
  }

  // Send invoice/payment email
  async sendInvoiceEmail(parentEmail, invoiceData) {
    const mailOptions = {
      from: process.env.ZOHO_MAIL_FROM || 'noreply@hometution.com',
      to: parentEmail,
      subject: 'Invoice - Home & Online Tutor Hub',
      html: `
        <h2>Invoice</h2>
        <p>Invoice ID: ${invoiceData.invoiceId}</p>
        <ul>
          <li><strong>Student:</strong> ${invoiceData.studentName}</li>
          <li><strong>Tutor:</strong> ${invoiceData.tutorName}</li>
          <li><strong>Amount:</strong> ₹${invoiceData.amount}</li>
          <li><strong>Due Date:</strong> ${invoiceData.dueDate.toLocaleDateString()}</li>
        </ul>
        <p><a href="${process.env.APP_URL}/invoice/${invoiceData.invoiceId}">Download Invoice</a></p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Invoice sent to ${parentEmail}`);
    } catch (error) {
      console.error('Email error:', error.message);
    }
  }
}

module.exports = new EmailService();
