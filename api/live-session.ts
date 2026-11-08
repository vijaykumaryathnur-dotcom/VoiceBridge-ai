import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function: /api/live-session
 * 
 * Generates short-lived ephemeral tokens for Gemini Live API sessions.
 * The permanent GEMINI_API_KEY is kept strictly on the server and is NEVER exposed to the browser.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set security and CORS headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Read server-side GEMINI_API_KEY configured in Vercel Project Settings
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  const isConfigured = Boolean(key && key.length > 5);

  if (!isConfigured) {
    return res.status(200).json({
      success: false,
      configured: false,
      model: 'gemini-3.8-live',
      error: 'GEMINI_API_KEY is not configured on Vercel. Please add GEMINI_API_KEY to your Vercel Project Settings > Environment Variables and redeploy.',
      environment: 'vercel',
      hint: 'In your Vercel Dashboard: Project Settings > Environment Variables, add GEMINI_API_KEY, and redeploy.'
    });
  }

  try {
    // Generate secure ephemeral token via official Google GenAI v1alpha auth_tokens API
    const tokenRes = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VoiceBridge-AI/1.0'
        },
        body: JSON.stringify({
          bidiGenerateContentSetup: {
            model: 'models/gemini-3.8-live'
          }
        })
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[api/live-session] Ephemeral token creation failed:', tokenRes.status, errText);
      return res.status(200).json({
        success: false,
        configured: true,
        error: `Failed to create ephemeral session token from Gemini API (${tokenRes.status}). Please verify that GEMINI_API_KEY is valid.`,
        details: errText,
        environment: 'vercel'
      });
    }

    const tokenData = (await tokenRes.json()) as { name?: string };
    const ephemeralToken = tokenData?.name;

    if (!ephemeralToken) {
      return res.status(200).json({
        success: false,
        configured: true,
        error: 'Gemini API returned an empty token resource name.',
        environment: 'vercel'
      });
    }

    // Success: Return ephemeral token and constrained WebSocket endpoint.
    // SECURITY GUARANTEE: The permanent GEMINI_API_KEY is NEVER sent to the client.
    return res.status(200).json({
      success: true,
      configured: true,
      token: ephemeralToken,
      model: 'gemini-3.8-live',
      voice: 'Aoede',
      voices: ['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck', 'Zephyr'],
      websocketEndpoint:
        'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained',
      environment: 'vercel'
    });
  } catch (err: any) {
    console.error('[api/live-session] Server error:', err);
    return res.status(500).json({
      success: false,
      configured: true,
      error: `Server error generating session token: ${err?.message || err}`,
      environment: 'vercel'
    });
  }
}

