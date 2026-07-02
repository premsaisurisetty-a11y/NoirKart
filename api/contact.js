import nodemailer from 'nodemailer';

// Nodemailer SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || ""
  }
});

// ---------------------------------------------------------------------------
// Security: In-memory rate limiter (per IP, resets per Vercel function lifecycle)
// Limits to 5 requests per 10 minutes per IP address.
// ---------------------------------------------------------------------------
const rateLimitMap = new Map(); // ip -> { count, firstRequest }
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.firstRequest > RATE_LIMIT_WINDOW_MS) {
    // Start a new window
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true; // Blocked
  }

  entry.count++;
  return false;
}

// ---------------------------------------------------------------------------
// Security: HTML escape — prevents XSS in email body
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ---------------------------------------------------------------------------
// Security: Validate email format
// ---------------------------------------------------------------------------
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

// ---------------------------------------------------------------------------
// Security: Allowed origins for CORS
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  'https://noirkart.com',
  'https://www.noirkart.com',
  'https://noir-kart.vercel.app',
];

export default async function handler(req, res) {
  // -------------------------------------------------------------------------
  // Security: CORS — only allow requests from the noirkart domain
  // -------------------------------------------------------------------------
  const origin = req.headers['origin'] || '';
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden: invalid origin.' });
  }

  // Set CORS headers for allowed origins
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // -------------------------------------------------------------------------
  // Security: Method enforcement — only allow POST
  // -------------------------------------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // -------------------------------------------------------------------------
  // Security: Content-Type enforcement
  // -------------------------------------------------------------------------
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json.' });
  }

  // -------------------------------------------------------------------------
  // Security: Rate limiting — 5 requests per 10 minutes per IP
  // -------------------------------------------------------------------------
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a few minutes before trying again.',
    });
  }

  // -------------------------------------------------------------------------
  // Extract and validate fields
  // -------------------------------------------------------------------------
  const { name, email, message, honeypot } = req.body || {};

  // Security: Honeypot — bots fill hidden fields; real users don't
  if (honeypot && honeypot.trim() !== '') {
    // Silently accept to not reveal the bot detection method
    return res.status(200).json({ success: true });
  }

  // Security: Validate required fields are present
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Security: Type checks
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid field types.' });
  }

  // Security: Length limits
  if (name.trim().length > 100) {
    return res.status(400).json({ error: 'Name must be under 100 characters.' });
  }
  if (message.trim().length > 5000) {
    return res.status(400).json({ error: 'Message must be under 5000 characters.' });
  }

  // Security: Email format validation
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  // Security: SMTP check
  const isSmtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!isSmtpConfigured) {
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  // -------------------------------------------------------------------------
  // Security: Sanitize all fields before injecting into HTML email template
  // -------------------------------------------------------------------------
  const safeName = escapeHtml(name.trim().slice(0, 100));
  const safeEmail = escapeHtml(email.trim().slice(0, 254));
  const safeMessage = escapeHtml(message.trim().slice(0, 5000))
    .replace(/\n/g, '<br/>'); // safe newlines in email body

  try {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    await transporter.sendMail({
      from: `NoirKart Contact <${fromEmail}>`,
      to: 'premsaisurisetty@gmail.com',
      replyTo: safeEmail,
      subject: `NoirKart Contact: Message from ${safeName}`,
      html: `
        <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
          <div style="background: linear-gradient(135deg, #E23744, #CB202D); padding: 32px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
              NoirKart
            </h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">New Contact Form Submission</p>
          </div>
          <div style="padding: 32px; background: white;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #999; width: 100px;">Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 15px; color: #111; font-weight: 600;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #999;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 15px; color: #E23744;">
                  <a href="mailto:${safeEmail}" style="color: #E23744; text-decoration: none;">${safeEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 14px 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #999; vertical-align: top;">Message</td>
                <td style="padding: 14px 0 0; font-size: 15px; color: #333; line-height: 1.6;">${safeMessage}</td>
              </tr>
            </table>
          </div>
          <div style="padding: 20px 32px; background: #f9f9f9; text-align: center; font-size: 11px; color: #bbb; border-top: 1px solid #eee;">
            Sent via NoirKart Contact Form &mdash; <a href="https://noirkart.com" style="color: #E23744; text-decoration: none;">noirkart.com</a>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('SMTP error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}
