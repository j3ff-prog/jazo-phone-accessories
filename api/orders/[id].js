// api/orders/[id].js — PUT update order status
const supabase = require('../_supabase');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing order id' });

  if (req.method === 'PUT') {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Missing status' });

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
