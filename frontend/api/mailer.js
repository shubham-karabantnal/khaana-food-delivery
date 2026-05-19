const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Basic security: require a secret key so no one else can spam from their Vercel URL
  if (req.headers['x-mailer-secret'] !== process.env.MAILER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { to, subject, html, attachments } = req.body;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    // If attachments exist, they are sent as base64 from the backend
    let mailAttachments = [];
    if (attachments && attachments.length > 0) {
      mailAttachments = attachments.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType
      }));
    }

    const info = await transporter.sendMail({
      from: `"Khaana System" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      attachments: mailAttachments
    });

    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
