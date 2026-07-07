/* ═══════════════════════════════════════════
   JAZO PHONE ACCESSORIES — Storefront JS
   ═══════════════════════════════════════════ */

(() => {
  'use strict';

  let allProducts = [], filteredProducts = [];
  let activeCategory = 'all', activeSort = 'newest';
  let cart = loadCart();
  let searchTimeout, toastTimer;

  const productGrid      = document.getElementById('product-grid');
  const emptyState       = document.getElementById('empty-state');
  const shopHeading      = document.getElementById('shop-heading');
  const sortSelect       = document.getElementById('sort-select');
  const searchInput      = document.getElementById('search-input');
  const searchResults    = document.getElementById('search-results');
  const cartBtn          = document.getElementById('cart-btn');
  const cartCount        = document.getElementById('cart-count');
  const cartOverlay      = document.getElementById('cart-overlay');
  const cartDrawer       = document.getElementById('cart-drawer');
  const cartClose        = document.getElementById('cart-close');
  const cartItemsEl      = document.getElementById('cart-items');
  const cartFooter       = document.getElementById('cart-footer');
  const cartTotalEl      = document.getElementById('cart-total-price');
  const checkoutBtn      = document.getElementById('checkout-btn');
  const checkoutOverlay  = document.getElementById('checkout-overlay');
  const coCancel         = document.getElementById('co-cancel');
  const checkoutForm     = document.getElementById('checkout-form');
  const confirmOverlay   = document.getElementById('confirm-overlay');
  const confClose        = document.getElementById('conf-close');
  const toast            = document.getElementById('toast');
  const hamburger        = document.getElementById('hamburger');
  const mainNav          = document.getElementById('main-nav');
  const contactForm      = document.getElementById('contact-form');
  const productPageOverlay = document.getElementById('product-page-overlay');
  const productPageBack  = document.getElementById('product-page-back');
  const productPageInner = document.getElementById('product-page-inner');

  /* ══ INIT ══ */
  async function init() {
    await loadProducts();
    renderCart();
    bindEvents();
  }

  async function loadProducts() {
    productGrid.innerHTML = '<p class="loading-state">Loading products…</p>';
    try {
      allProducts = await JazoAPI.getProducts();
      applyFilters();
    } catch {
      productGrid.innerHTML = '<p class="empty-state">Could not load products. Make sure the server is running.</p>';
    }
  }

  function applyFilters() {
    let list = [...allProducts];
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);
    switch (activeSort) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      default:           list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    filteredProducts = list;
    renderGrid();
  }

  /* ══ PRODUCT GRID ══ */
  function renderGrid() {
    const catLabels = { all: 'All Products', cases: 'Cases', chargers: 'Chargers', earphones: 'Earphones', 'screen-protectors': 'Screen Protectors', powerbanks: 'Powerbanks', accessories: 'Accessories' };
    shopHeading.textContent = catLabels[activeCategory] || 'All Products';

    if (!filteredProducts.length) {
      productGrid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    productGrid.innerHTML = filteredProducts.map(p => {
      const img = (p.images && p.images.length) ? p.images[0] : (p.image || JazoAPI.placeholderSVG());
      const badges = [];
      if (p.stock === 0) badges.push('<span class="badge badge-out">Out of Stock</span>');
      else if (p.is_new) badges.push('<span class="badge badge-new">New</span>');
      if (p.old_price) badges.push('<span class="badge badge-sale">Sale</span>');

      return `<div class="product-card" data-id="${p.id}">
        <div class="product-card-img">
          <img src="${img}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='${JazoAPI.placeholderSVG()}'" />
          ${badges.length ? `<div class="product-badges">${badges.join('')}</div>` : ''}
        </div>
        <div class="product-card-body">
          <p class="product-cat">${esc(p.category)}</p>
          <p class="product-name">${esc(p.name)}</p>
          <div class="product-pricing">
            <span class="product-price">${JazoAPI.formatPrice(p.price)}</span>
            ${p.old_price ? `<span class="product-old-price">${JazoAPI.formatPrice(p.old_price)}</span>` : ''}
          </div>
          <div class="product-card-actions">
            <button class="btn btn-outline card-view-btn" ${p.stock === 0 ? 'disabled' : ''}>View</button>
            <button class="btn btn-primary card-cart-btn" ${p.stock === 0 ? 'disabled' : ''}>Add</button>
          </div>
        </div>
      </div>`;
    }).join('');

    productGrid.querySelectorAll('.product-card').forEach(card => {
      const id = card.dataset.id;
      card.querySelector('.card-view-btn').addEventListener('click', e => { e.stopPropagation(); openProductPage(id); });
      card.querySelector('.card-cart-btn').addEventListener('click', e => { e.stopPropagation(); addToCart(id); });
      card.addEventListener('click', () => openProductPage(id));
    });
  }

  /* ══ PRODUCT PAGE ══ */
  function openProductPage(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    const images = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
    const mainImg = images[0] || JazoAPI.placeholderSVG();

    const thumbsHTML = images.length > 0 ? `
      <div class="pp-thumbs">
        ${images.map((src, i) => `<div class="pp-thumb ${i === 0 ? 'active' : ''}" data-src="${src}">
          <img src="${src}" alt="" onerror="this.src='${JazoAPI.placeholderSVG()}'" />
        </div>`).join('')}
      </div>` : '';

    const stockLabel = p.stock === 0
      ? '<p class="pp-stock out">Out of stock</p>'
      : `<p class="pp-stock in">In stock — ${p.stock} available</p>`;

    productPageInner.innerHTML = `
      <div class="pp-gallery">
        <div class="pp-main-img">
          <img src="${mainImg}" alt="${esc(p.name)}" id="pp-main-img" onerror="this.src='${JazoAPI.placeholderSVG()}'" />
        </div>
        ${thumbsHTML}
      </div>
      <div class="pp-details">
        <p class="pp-cat">${esc(p.category)}</p>
        <h1 class="pp-name">${esc(p.name)}</h1>
        <div class="pp-pricing">
          <span class="pp-price">${JazoAPI.formatPrice(p.price)}</span>
          ${p.old_price ? `<span class="pp-old">${JazoAPI.formatPrice(p.old_price)}</span>` : ''}
        </div>
        ${stockLabel}
        <p class="pp-desc">${esc(p.description)}</p>
        <div class="pp-actions">
          <button class="btn btn-primary" id="pp-cart-btn" ${p.stock === 0 ? 'disabled' : ''}>Add to Cart</button>
          <button class="btn btn-ghost" id="pp-back-btn">Back to Shop</button>
        </div>
      </div>`;

    /* thumb clicks */
    productPageInner.querySelectorAll('.pp-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const mainImg = document.getElementById('pp-main-img');
        if (mainImg) mainImg.src = thumb.dataset.src;
        productPageInner.querySelectorAll('.pp-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
      /* mobile touch support */
      thumb.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mainImg = document.getElementById('pp-main-img');
        if (mainImg) mainImg.src = thumb.dataset.src;
        productPageInner.querySelectorAll('.pp-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });

    document.getElementById('pp-cart-btn').addEventListener('click', () => { addToCart(id); showToast(`${p.name} added to cart`); });
    document.getElementById('pp-back-btn').addEventListener('click', closeProductPage);

    productPageOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    productPageOverlay.scrollTo(0, 0);
  }

  function closeProductPage() {
    productPageOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ══ CART ══ */
  function loadCart() {
    try { return JSON.parse(localStorage.getItem('jazo_cart')) || []; } catch { return []; }
  }
  function saveCart() { localStorage.setItem('jazo_cart', JSON.stringify(cart)); }
  function findProduct(id) { return allProducts.find(p => p.id === id) || null; }

  function addToCart(id) {
    const p = findProduct(id);
    if (!p || p.stock === 0) return;
    const existing = cart.find(i => i.id === id);
    if (existing) {
      if (existing.qty < p.stock) existing.qty++;
      else { showToast('Maximum stock reached'); return; }
    } else {
      cart.push({ id, qty: 1 });
    }
    saveCart();
    renderCart();
    showToast(`${p.name} added to cart`);
  }

  function removeFromCart(id) { cart = cart.filter(i => i.id !== id); saveCart(); renderCart(); }

  function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const p = findProduct(id);
    const newQty = item.qty + delta;
    if (newQty < 1) { removeFromCart(id); return; }
    if (p && newQty > p.stock) { showToast('Maximum stock reached'); return; }
    item.qty = newQty;
    saveCart();
    renderCart();
  }

  function cartTotal() { return cart.reduce((s, i) => { const p = findProduct(i.id); return p ? s + p.price * i.qty : s; }, 0); }

  function renderCart() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    cartCount.textContent = total;
    cartCount.style.display = total ? 'flex' : 'none';

    if (!cart.length) {
      cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      cartFooter.style.display = 'none';
      return;
    }
    cartItemsEl.innerHTML = cart.map(item => {
      const p = findProduct(item.id);
      if (!p) return '';
      const img = (p.images && p.images.length) ? p.images[0] : (p.image || JazoAPI.placeholderSVG());
      return `<div class="cart-item" data-id="${p.id}">
        <div class="cart-item-img"><img src="${img}" alt="${esc(p.name)}" onerror="this.src='${JazoAPI.placeholderSVG()}'" /></div>
        <div class="cart-item-info">
          <p class="cart-item-name">${esc(p.name)}</p>
          <p class="cart-item-price">${JazoAPI.formatPrice(p.price)}</p>
          <div class="cart-item-qty">
            <button class="qty-btn" data-action="dec" data-id="${p.id}">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${p.id}">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-id="${p.id}">&times;</button>
      </div>`;
    }).join('');
    cartFooter.style.display = 'flex';
    cartTotalEl.textContent = JazoAPI.formatPrice(cartTotal());
    cartItemsEl.querySelectorAll('.qty-btn').forEach(btn => btn.addEventListener('click', () => changeQty(btn.dataset.id, btn.dataset.action === 'inc' ? 1 : -1)));
    cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => btn.addEventListener('click', () => removeFromCart(btn.dataset.id)));
  }

  function openCart() { cartDrawer.classList.add('open'); cartOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeCart() { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('active'); document.body.style.overflow = ''; }

  /* ══ CHECKOUT ══ */
  function openCheckout() {
    if (!cart.length) { showToast('Your cart is empty'); return; }
    closeCart();
    document.getElementById('co-summary').innerHTML = cart.map(item => {
      const p = findProduct(item.id);
      if (!p) return '';
      return `<div class="co-item"><span class="co-item-name">${esc(p.name)} × ${item.qty}</span><span class="co-item-price">${JazoAPI.formatPrice(p.price * item.qty)}</span></div>`;
    }).join('');
    document.getElementById('co-total').textContent = JazoAPI.formatPrice(cartTotal());
    document.getElementById('checkout-error').textContent = '';
    document.getElementById('co-name').value = '';
    document.getElementById('co-phone').value = '';
    document.getElementById('co-address').value = '';
    document.getElementById('co-note').value = '';
    checkoutOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckout() { checkoutOverlay.classList.remove('active'); document.body.style.overflow = ''; }

  async function submitOrder(e) {
    e.preventDefault();
    const errEl = document.getElementById('checkout-error');
    errEl.textContent = '';
    const name = document.getElementById('co-name').value.trim();
    const phone = document.getElementById('co-phone').value.trim();
    const address = document.getElementById('co-address').value.trim();
    const note = document.getElementById('co-note').value.trim();
    if (!name || !phone || !address) { errEl.textContent = 'Please fill in your name, phone and delivery address.'; return; }

    const submitEl = document.getElementById('co-submit');
    submitEl.disabled = true;
    submitEl.textContent = 'Placing order…';

    const orderItems = cart.map(item => {
      const p = findProduct(item.id);
      return { productId: item.id, name: p ? p.name : item.id, qty: item.qty, price: p ? p.price : 0 };
    });

    try {
      const order = await JazoAPI.createOrder({ customer: { name, phone, address }, items: orderItems, total: cartTotal(), note });
      cart = []; saveCart(); renderCart(); closeCheckout();
      allProducts = await JazoAPI.getProducts(); applyFilters();

      const WHATSAPP_NUMBER = '254720663044';
      const itemsText = order.items.map(i => `• ${i.name} x${i.qty} — ${JazoAPI.formatPrice(i.price * i.qty)}`).join('\n');
      const waMsg = encodeURIComponent(`Hello Jazo Phone Accessories,\n\nOrder Confirmation:\nOrder ID: ${order.id}\nName: ${name}\n\nItems:\n${itemsText}\n\nTotal: ${JazoAPI.formatPrice(order.total)}\n\nPlease confirm and advise on delivery.`);

      document.getElementById('conf-name').textContent = name;
      document.getElementById('conf-order-id').textContent = order.id;
      document.getElementById('conf-total').textContent = JazoAPI.formatPrice(order.total);
      document.getElementById('conf-whatsapp').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;
      confirmOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    } catch (err) {
      errEl.textContent = 'Failed to place order. Please try again.';
      submitEl.disabled = false;
      submitEl.textContent = 'Place Order';
    }
  }

  /* ══ SEARCH ══ */
  function handleSearch(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const q = query.trim().toLowerCase();
      if (!q) { searchResults.classList.remove('active'); return; }
      const results = allProducts.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 6);
      if (!results.length) {
        searchResults.innerHTML = '<p class="search-no-result">No products found.</p>';
      } else {
        searchResults.innerHTML = results.map(p => {
          const img = (p.images && p.images.length) ? p.images[0] : (p.image || JazoAPI.placeholderSVG());
          return `<div class="search-result-item" data-id="${p.id}">
            <img src="${img}" alt="${esc(p.name)}" onerror="this.src='${JazoAPI.placeholderSVG()}'" />
            <div><p class="search-result-name">${esc(p.name)}</p><p class="search-result-price">${JazoAPI.formatPrice(p.price)}</p></div>
          </div>`;
        }).join('');
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('click', () => { openProductPage(item.dataset.id); searchResults.classList.remove('active'); searchInput.value = ''; });
        });
      }
      searchResults.classList.add('active');
    }, 250);
  }

  /* ══ TOAST ══ */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  /* ══ EVENTS ══ */
  function bindEvents() {
    document.querySelectorAll('.cat-card').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.cat;
        applyFilters();
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
      });
    });
    sortSelect.addEventListener('change', () => { activeSort = sortSelect.value; applyFilters(); });
    searchInput.addEventListener('input', e => handleSearch(e.target.value));
    document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) searchResults.classList.remove('active'); });
    cartBtn.addEventListener('click', openCart);
    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    checkoutBtn.addEventListener('click', openCheckout);
    coCancel.addEventListener('click', closeCheckout);
    checkoutOverlay.addEventListener('click', e => { if (e.target === checkoutOverlay) closeCheckout(); });
    checkoutForm.addEventListener('submit', submitOrder);
    confClose.addEventListener('click', () => { confirmOverlay.classList.remove('active'); document.body.style.overflow = ''; });
    confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) { confirmOverlay.classList.remove('active'); document.body.style.overflow = ''; } });
    productPageBack.addEventListener('click', closeProductPage);
    productPageOverlay.addEventListener('click', e => { if (e.target === productPageOverlay) closeProductPage(); });
    hamburger.addEventListener('click', () => mainNav.classList.toggle('open'));
    if (contactForm) {
      contactForm.addEventListener('submit', e => {
        e.preventDefault();
        document.getElementById('form-success').style.display = 'block';
        contactForm.reset();
        setTimeout(() => document.getElementById('form-success').style.display = 'none', 4000);
      });
    }
  }

  function esc(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  document.addEventListener('DOMContentLoaded', init);
})();
