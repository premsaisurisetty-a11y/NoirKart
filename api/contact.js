import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  try {
    await resend.emails.send({
      from: 'NoirKart Contact <onboarding@resend.dev>',
      to: 'premsaisurisetty@gmail.com',
      replyTo: email,
      subject: `NoirKart Contact: Message from ${name}`,
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
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 15px; color: #111; font-weight: 600;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #999;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 15px; color: #E23744;">
                  <a href="mailto:${email}" style="color: #E23744; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 14px 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #999; vertical-align: top;">Message</td>
                <td style="padding: 14px 0 0; font-size: 15px; color: #333; line-height: 1.6;">${message.replace(/\n/g, '<br/>')}</td>
              </tr>
            </table>
          </div>
          <div style="padding: 20px 32px; background: #f9f9f9; text-align: center; font-size: 11px; color: #bbb; border-top: 1px solid #eee;">
            Sent via NoirKart Contact Form &mdash; <a href="https://noir-kart.vercel.app" style="color: #E23744; text-decoration: none;">noir-kart.vercel.app</a>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}
