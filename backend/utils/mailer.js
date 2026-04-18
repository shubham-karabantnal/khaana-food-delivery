const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// Initialize Transporter with Gmail App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (toEmail, otp) => {
  const mailOptions = {
    from: `"Khaana Support" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Khaana Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #FF523B;">Welcome to Khaana!</h2>
        <p>Your verification code is below. It will expire in 10 minutes.</p>
        <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 5px;">
          ${otp}
        </div>
        <p style="margin-top: 20px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Real Email Sent to ${toEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Mailing Error:', error.message);
    // Fallback to console log for development debugging if needed
    console.log(`OTP for ${toEmail}: ${otp}`);
    throw error;
  }
};

const sendStatusUpdateEmail = async (toEmail, orderId, status) => {
  const mailOptions = {
    from: `"Khaana Orders" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Update on your Khaana Order #${orderId.substring(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #FF523B;">Order Status Update</h2>
        <p>Your order <strong>#${orderId.substring(0, 8)}</strong> is now <strong>${status.replace(/_/g, ' ').toUpperCase()}</strong>.</p>
        <p>Thank you for choosing Khaana!</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Order Update Sent to ${toEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Mailing Error (Status Update):', error.message);
    throw error;
  }
};

const sendPasswordResetOTP = async (toEmail, otp) => {
  const mailOptions = {
    from: `"Khaana Security" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset Your Khaana Password',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #FF523B;">Password Reset Request</h2>
        <p>You requested to reset your password. Use the following code to proceed:</p>
        <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 5px;">
          ${otp}
        </div>
        <p style="margin-top: 20px;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
        <p style="color: #777; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Password Reset Email Sent to ${toEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Mailing Error (Password Reset):', error.message);
    throw error;
  }
};

const sendOrderBillEmail = async (orderDetails, orderItems) => {
  const {
    order_id, total_amount, created_at, 
    customer_name, customer_email, restaurant_name
  } = orderDetails;

  const orderDate = new Date(created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  try {
    // Generate PDF in memory
    const pdfBuffer = await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A5' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(24).fillColor('#4F46E5').text(restaurant_name, { align: 'center' });
        doc.fontSize(12).fillColor('#888888').text('Official Receipt', { align: 'center' });
        doc.moveDown(2);

        // Meta Box
        doc.fillColor('#333333').fontSize(12);
        doc.text(`Order ID: #${order_id.substring(0, 8)}`);
        doc.text(`Date: ${orderDate}`);
        doc.text(`Customer: ${customer_name}`);
        doc.moveDown(2);

        // Items
        doc.fontSize(14).fillColor('#000000').text('Bill Details', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#444444');
        
        orderItems.forEach(item => {
          const itemTotal = (item.quantity * item.price_at_time).toFixed(2);
          doc.text(`${item.item_name}  x${item.quantity}`, { continued: true });
          doc.text(`Rs. ${itemTotal}`, { align: 'right' });
        });
        
        doc.moveDown(2);
        doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#cccccc').stroke();
        doc.moveDown(1);

        // Final Total
        doc.fontSize(18).fillColor('#4F46E5').text(`Total Paid: Rs. ${parseFloat(total_amount).toFixed(2)}`, { align: 'right' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });

    // Send Mail with minimalist HTML and PDF attachment
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto; text-align: center;">
        <h2 style="color: #4F46E5;">Thank You for Your Order!</h2>
        <p style="color: #555; font-size: 16px;">We have securely processed your order from <strong>${restaurant_name}</strong>.</p>
        <p style="color: #555; font-size: 16px;">Please find your official total bill attached to this email as a PDF document.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">Khaana automated receipt system.</p>
      </div>
    `;

    const mailOptions = {
      from: '"Khaana Billing" <' + process.env.GMAIL_USER + '>',
      to: customer_email,
      subject: `Your Receipt from ${restaurant_name} (Order #${order_id.substring(0, 8)})`,
      html,
      attachments: [
        {
          filename: `Khaana_Receipt_${order_id.substring(0, 8)}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Order PDF Bill Sent to ${customer_email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Mailing Error (Order PDF Bill):', error.message);
  }
};

module.exports = { generateOTP, sendOTP, sendStatusUpdateEmail, sendPasswordResetOTP, sendOrderBillEmail };
