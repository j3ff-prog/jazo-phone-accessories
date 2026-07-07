/* ═══════════════════════════════════════════
   JAZO PHONE ACCESSORIES — API Client
   ═══════════════════════════════════════════ */

const JazoAPI = (() => {
  const BASE = '/api';

  async function request(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }

  const getProducts   = (category) => request('GET', '/products' + (category && category !== 'all' ? `?category=${category}` : ''));
  const getProduct    = (id)        => request('GET', `/products/${id}`);
  const addProduct    = (data)      => request('POST', '/products', data);
  const updateProduct = (id, data)  => request('PUT', `/products/${id}`, data);
  const deleteProduct = (id)        => request('DELETE', `/products/${id}`);

  async function uploadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const res = await request('POST', '/upload', { base64: e.target.result, filename: file.name, mimetype: file.type });
          resolve(res.url);
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  const createOrder       = (data)       => request('POST', '/orders', data);
  const getOrders         = ()           => request('GET', '/orders');
  const updateOrderStatus = (id, status) => request('PUT', `/orders/${id}`, { status });

  function formatPrice(num) {
    return 'KSh ' + Number(num).toLocaleString('en-KE');
  }

  function placeholderSVG() {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Crect x='155' y='140' width='90' height='160' rx='12' fill='%23cbd5e1'/%3E%3Crect x='165' y='155' width='70' height='110' rx='4' fill='%23e2e8f0'/%3E%3C/svg%3E`;
  }

  return { getProducts, getProduct, addProduct, updateProduct, deleteProduct, uploadImage, createOrder, getOrders, updateOrderStatus, formatPrice, placeholderSVG };
})();
