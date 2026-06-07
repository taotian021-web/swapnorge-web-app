import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    // Allow dev mode: if service key missing, we'll accept the upload and return a data URL for testing.
    // This keeps the API usable for local dev without exposing secrets.
    // Note: not suitable for production.
    // We'll still process below after reading the body.
    // (Do not early return)
  }

  const userId = req.headers['x-user-id'] as string | undefined;
  const filenameHeader = req.headers['x-filename'] as string | undefined;
  const contentType = (req.headers['content-type'] as string) || 'application/octet-stream';

  if (!userId) return res.status(400).json({ error: 'Missing x-user-id header' });
  if (!filenameHeader) return res.status(400).json({ error: 'Missing x-filename header' });

  try {
    const buffer = await getRawBody(req as unknown as NextApiRequest);

    // Server-side validation: size and content-type
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (buffer.length > MAX_SIZE) {
      return res.status(413).json({ error: `File too large. Max ${Math.round(MAX_SIZE / (1024 * 1024))}MB.` });
    }

    const lowerContentType = (contentType || '').toLowerCase();
    if (!lowerContentType.startsWith('video/') && !lowerContentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Invalid file type. Only images and videos are allowed.' });
    }

    const ext = filenameHeader.split('.').pop();
    const filePath = `videos/${userId}/${Date.now()}.${ext}`;

    if (serviceKey && supabaseUrl) {
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      });

      const { error } = await supabase.storage.from('videos').upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

      if (error) {
        console.error('Server upload error', error);
        return res.status(500).json({ error: error.message });
      }

      const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/videos/${encodeURIComponent(filePath)}`;
      return res.status(200).json({ publicUrl });
    } else {
      // Dev fallback: return a data URL so front-end can proceed without Supabase.
      const base64 = buffer.toString('base64');
      const publicUrl = `data:${contentType};base64,${base64}`;
      return res.status(200).json({ publicUrl, devFallback: true });
    }
  } catch (err) {
    console.error('Upload handler error', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: errorMessage });
  }
}
