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
    const { name, category, description, price, old_price, stock, image, images, featured, is_new, brand, model_options } = req.body;

    // Resolve images array and primary image consistently
    const imagesArr = Array.isArray(images) && images.length ? images : (image ? [image] : []);
    const primaryImage = imagesArr[0] || '';

    const updates = {};
    if (name        !== undefined) updates.name        = name.trim();
    if (category    !== undefined) updates.category    = category;
    if (description !== undefined) updates.description = description.trim();
    if (price       !== undefined) updates.price       = Number(price);
    if (old_price   !== undefined) updates.old_price   = old_price ? Number(old_price) : null;
    if (stock       !== undefined) updates.stock       = Number(stock);
    if (image       !== undefined) updates.image       = primaryImage;
    if (images      !== undefined) updates.images      = imagesArr;
    if (featured    !== undefined) updates.featured    = Boolean(featured);
    if (is_new      !== undefined) updates.is_new      = Boolean(is_new);
    if (brand       !== undefined) updates.brand         = brand;
    if (model_options !== undefined) updates.model_options = model_options;
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
    // Delete all images from Supabase Storage, not just the primary one
    const { data: product } = await supabase.from('products').select('image, images').eq('id', id).single();

    if (product) {
      // Collect all image URLs (images array + fallback to image field)
      const allUrls = Array.isArray(product.images) && product.images.length
        ? product.images
        : (product.image ? [product.image] : []);

      // Extract storage paths and delete them all
      const paths = allUrls
        .filter(url => url && url.includes('/storage/v1/object/'))
        .map(url => url.split('/product-images/')[1])
        .filter(Boolean);

      if (paths.length) {
        await supabase.storage.from('product-images').remove(paths);
      }
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};