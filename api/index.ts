import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server';

// Vercel Serverless Function entry point
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
