// api/products/[id].js — GET one / PUT update / DELETE
const supabase = require('../_supabase');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing product id' });

  /* ── GET /api/products/:id ── */
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error: 'Product not found' });
    return res.status(200).json(data);
  }

  /* ── PUT /api/products/:id ── */
  if (req.method === 'PUT') {
    const { name, category, description, price, old_price, stock, image, featured, is_new } = req.body;

    const updates = {};
    if (name        !== undefined) updates.name        = name.trim();
    if (category    !== undefined) updates.category    = category;
    if (description !== undefined) updates.description = description.trim();
    if (price       !== undefined) updates.price       = Number(price);
    if (old_price   !== undefined) updates.old_price   = old_price ? Number(old_price) : null;
    if (stock       !== undefined) updates.stock       = Number(stock);
    if (image       !== undefined) updates.image       = image;
    if (featured    !== undefined) updates.featured    = Boolean(featured);
    if (is_new      !== undefined) updates.is_new      = Boolean(is_new);
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  /* ── DELETE /api/products/:id ── */
  if (req.method === 'DELETE') {
    // also delete image from storage if it's a Supabase storage URL
    const { data: product } = await supabase.from('products').select('image').eq('id', id).single();
    if (product?.image && product.image.includes('/storage/v1/object/')) {
      const path = product.image.split('/product-images/')[1];
      if (path) await supabase.storage.from('product-images').remove([path]);
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
