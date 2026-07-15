// api/products.js  — GET all products / POST new product
const supabase = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  /* ── GET /api/products ── */
  if (req.method === 'GET') {
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (req.query.category && req.query.category !== 'all') {
      query = query.eq('category', req.query.category);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  /* ── POST /api/products ── */
  if (req.method === 'POST') {
    const { name, category, description, price, old_price, stock, image, images, featured, is_new, brand, model_options } = req.body;

    if (!name || !category || !description || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Resolve images array and primary image consistently
    const imagesArr = Array.isArray(images) && images.length ? images : (image ? [image] : []);
    const primaryImage = imagesArr[0] || '';

    const { data, error } = await supabase
      .from('products')
      .insert([{
        name:        name.trim(),
        category,
        description: description.trim(),
        price:       Number(price),
        old_price:   old_price ? Number(old_price) : null,
        stock:       Number(stock),
        image:       primaryImage,
        images:      imagesArr,
        featured:    Boolean(featured),
        is_new:      is_new !== undefined ? Boolean(is_new) : true,
        brand:       brand || '',
        model_options: model_options || [],
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.status(405).json({ error: 'Method not allowed' });
};