// api/upload.js — receives base64 image, stores in Supabase Storage, returns public URL
const supabase = require('./_supabase');

// Vercel serverless has a 4.5MB body limit — enough for most product photos
// Admin should keep images under 4MB

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { base64, filename, mimetype } = req.body;
  if (!base64 || !filename) return res.status(400).json({ error: 'Missing file data' });

  // decode base64 → buffer
  const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const ext    = (mimetype || 'image/jpeg').split('/')[1] || 'jpg';
  const path   = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, buffer, { contentType: mimetype || 'image/jpeg', upsert: false });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return res.status(200).json({ url: data.publicUrl });
};
