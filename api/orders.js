const supabase = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  /* GET /api/orders */
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  /* POST /api/orders */
  if (req.method === 'POST') {
    const { customer, items, total, note } = req.body;
    if (!customer || !items?.length) {
      return res.status(400).json({ error: 'Missing order data' });
    }

    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();

    /* decrement stock */
    for (const item of items) {
      const { data: product } = await supabase
        .from('products').select('stock').eq('id', item.productId).single();
      if (product) {
        await supabase.from('products')
          .update({ stock: Math.max(0, product.stock - item.qty) })
          .eq('id', item.productId);
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        id: orderId,
        customer,
        items,
        total: Number(total),
        note: note || '',
        status: 'pending',
      }])
      .select().single();

    if (error) return res.status(500).json({ error: error.message });

    /* send email notification */
    try {
      const itemsHTML = items.map(i =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${i.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">×${i.qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">KSh ${(i.price * i.qty).toLocaleString()}</td>
        </tr>`
      ).join('');

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Jazo Orders <onboarding@resend.dev>',
          to: 'gladyssituma1@gmail.com',
          subject: `New Order ${orderId} — KSh ${Number(total).toLocaleString()}`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
              <div style="background:#0d1b2a;padding:20px 24px;">
                <h1 style="color:#14b8a8;margin:0;font-size:20px;">Jazo Phone Accessories</h1>
                <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px;">New Order Received</p>
              </div>
              <div style="padding:24px;background:#f8fafc;">
                <h2 style="color:#0d1b2a;margin:0 0 4px;">Order ${orderId}</h2>
                <p style="color:#64748b;margin:0 0 20px;font-size:13px;">Placed just now</p>

                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px;">
                  <div style="padding:14px 16px;border-bottom:1px solid #e2e8f0;">
                    <strong style="font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Customer</strong>
                  </div>
                  <div style="padding:14px 16px;">
                    <p style="margin:0 0 4px;font-weight:600;color:#0d1b2a;">${customer.name}</p>
                    <p style="margin:0 0 4px;color:#475569;font-size:14px;">📞 ${customer.phone}</p>
                    <p style="margin:0;color:#475569;font-size:14px;">📍 ${customer.address}</p>
                    ${note ? `<p style="margin:8px 0 0;color:#475569;font-size:14px;">📝 ${note}</p>` : ''}
                  </div>
                </div>

                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px;">
                  <div style="padding:14px 16px;border-bottom:1px solid #e2e8f0;">
                    <strong style="font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Items</strong>
                  </div>
                  <table style="width:100%;border-collapse:collapse;">
                    <thead>
                      <tr style="background:#f8fafc;">
                        <th style="padding:8px 12px;text-align:left;font-size:12px;color:#94a3b8;">Product</th>
                        <th style="padding:8px 12px;text-align:center;font-size:12px;color:#94a3b8;">Qty</th>
                        <th style="padding:8px 12px;text-align:right;font-size:12px;color:#94a3b8;">Total</th>
                      </tr>
                    </thead>
                    <tbody>${itemsHTML}</tbody>
                  </table>
                  <div style="padding:14px 16px;border-top:2px solid #e2e8f0;display:flex;justify-content:space-between;">
                    <strong style="color:#0d1b2a;">Total</strong>
                    <strong style="color:#0d9488;font-size:18px;">KSh ${Number(total).toLocaleString()}</strong>
                  </div>
                </div>

                <div style="text-align:center;">
                  <a href="https://wa.me/254720663044?text=Hi%20${encodeURIComponent(customer.name)}%2C%20your%20Jazo%20order%20${orderId}%20has%20been%20confirmed!"
                     style="display:inline-block;background:#25D366;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
                    WhatsApp Customer
                  </a>
                </div>
              </div>
            </div>
          `,
        }),
      });
    } catch (emailErr) {
      /* email failure should not block the order */
      console.error('Email notification failed:', emailErr);
    }

    return res.status(201).json(data);
  }

  res.status(405).json({ error: 'Method not allowed' });
};