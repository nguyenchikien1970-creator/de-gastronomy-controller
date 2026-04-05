export default async function handler(req: any, res: any) {
  // Chỉ chấp nhận POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // URL Google Apps Script webhook (cấu hình trong Vercel Environment Variables)
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('GOOGLE_SHEET_WEBHOOK_URL chưa được cấu hình.');
    return res.status(200).json({ status: 'skipped', message: 'Webhook URL not configured' });
  }

  try {
    const { email, timestamp, userAgent } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Thiếu email.' });
    }

    // Gửi data đến Google Apps Script webhook
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        timestamp: timestamp || new Date().toISOString(),
        userAgent: userAgent || 'Unknown',
      }),
    });

    return res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    console.error('Failed to log login:', error);
    // Không block user nếu log thất bại
    return res.status(200).json({ status: 'error', message: error.message });
  }
}
