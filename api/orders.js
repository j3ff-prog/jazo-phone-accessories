// api/orders.js — GET all orders / POST new order
const supabase = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  /* ── GET /api/orders ── */
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  /* ── POST /api/orders ── */
  if (req.method === 'POST') {
    const { customer, items, total, note } = req.body;
    if (!customer || !items?.length) {
      return res.status(400).json({ error: 'Missing order data' });
    }

    // Generate readable order ID
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();

    // Decrement stock for each item
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.productId)
        .single();

      if (product) {
        const newStock = Math.max(0, product.stock - item.qty);
        await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        id:       orderId,
        customer,
        items,
        total:    Number(total),
        note:     note || '',
        status:   'pending',
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
