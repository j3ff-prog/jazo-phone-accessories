/* ═══════════════════════════════════════════
   JAZO PHONE ACCESSORIES — Admin JS
   ═══════════════════════════════════════════ */

(() => {
  'use strict';

  const CREDS    = { user: 'admin', pass: 'jazo2025' };
  const AUTH_KEY = 'jazo_auth';

  const MODELS = {
    iphone:  ['13 Pro Max', '14 Pro Max', '15 Pro Max', '16 Pro Max', '17 Pro', '17 Pro Max'],
    samsung: ['S22 Ultra', 'S23 Ultra', 'S24 Ultra', 'S25 Ultra', 'S26 Ultra'],
  };

  let editingId       = null;
  let deleteTarget    = null;
  let adminSearch     = '';
  let adminCatFilter  = 'all';
  let allProducts     = [];
  let allOrders       = [];
  let pendingFiles    = [];
  let pendingExisting = [];
  let toastTimer;

  const loginScreen  = document.getElementById('login-screen');
  const dashboard    = document.getElementById('dashboard');
  const loginBtn     = document.getElementById('login-btn');
  const loginUser    = document.getElementById('l-user');
  const loginPass    = document.getElementById('l-pass');
  const loginError   = document.getElementById('login-error');
  const logoutBtn    = document.getElementById('logout-btn');
  const navItems     = document.querySelectorAll('.nav-item');
  const toast        = document.getElementById('admin-toast');
  const statTotal    = document.getElementById('stat-total');
  const statStock    = document.getElementById('stat-stock');
  const statFeatured = document.getElementById('stat-featured');
  const statOrders   = document.getElementById('stat-orders');
  const adminTbody   = document.getElementById('admin-tbody');
  const adminEmpty   = document.getElementById('admin-empty');
  const adminSearchI = document.getElementById('admin-search');
  const adminCatSel  = document.getElementById('admin-cat-filter');
  const productForm  = document.getElementById('product-form');
  const formTitle    = document.getElementById('form-title');
  const editIdField  = document.getElementById('edit-id');
  const cancelEdit   = document.getElementById('cancel-edit');
  const submitBtn    = document.getElementById('submit-btn');
  const resetBtn     = document.getElementById('reset-btn');
  const formError    = document.getElementById('form-error');
  const pName        = document.getElementById('p-name');
  const pCategory    = document.getElementById('p-category');
  const pDesc        = document.getElementById('p-desc');
  const pPrice       = document.getElementById('p-price');
  const pOldPrice    = document.getElementById('p-old-price');
  const pStock       = document.getElementById('p-stock');
  const pFeatured    = document.getElementById('p-featured');
  const pNew         = document.getElementById('p-new');
  const pImageFile   = document.getElementById('p-image-file');
  const pBrand       = document.getElementById('p-brand');
  const modelCheckboxes = document.getElementById('model-checkboxes');
  const modelGrid    = document.getElementById('model-grid');
  const delOverlay   = document.getElementById('del-overlay');
  const delName      = document.getElementById('del-name');
  const delConfirm   = document.getElementById('del-confirm');
  const delCancel    = document.getElementById('del-cancel');
  const ordersTbody  = document.getElementById('orders-tbody');
  const ordersEmpty  = document.getElementById('orders-empty');

  /* ══ AUTH ══ */
  function checkAuth() {
    if (sessionStorage.getItem(AUTH_KEY) === '1') showDashboard();
    else showLogin();
  }

  function showLogin() {
    loginScreen.style.display = 'flex';
    dashboard.style.display = 'none';
  }

  async function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'flex';
    await loadAll();
  }

  loginBtn.addEventListener('click', () => {
    loginError.textContent = '';
    if (loginUser.value.trim() === CREDS.user && loginPass.value.trim() === CREDS.pass) {
      sessionStorage.setItem(AUTH_KEY, '1');
      showDashboard();
    } else {
      loginError.textContent = 'Incorrect username or password.';
      loginPass.value = '';
    }
  });

  [loginUser, loginPass].forEach(el =>
    el.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); })
  );

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    showLogin();
    loginUser.value = '';
    loginPass.value = '';
  });

  /* ══ DATA ══ */
  async function loadAll() {
    try {
      [allProducts, allOrders] = await Promise.all([
        JazoAPI.getProducts(),
        JazoAPI.getOrders(),
      ]);
      updateStats();
      renderTable();
      renderOrders();
    } catch {
      showToast('Failed to load data. Check your connection.');
    }
  }

  /* ══ NAV ══ */
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchView(btn.dataset.view);
    });
  });

  function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById('view-' + view).style.display = 'flex';
    if (view === 'products') { updateStats(); renderTable(); }
    if (view === 'orders')   renderOrders();
    if (view === 'add' && !editingId) resetForm();
  }

  /* ══ STATS ══ */
  function updateStats() {
    statTotal.textContent    = allProducts.length;
    statStock.textContent    = allProducts.filter(p => p.stock > 0).length;
    statFeatured.textContent = allProducts.filter(p => p.featured).length;
    statOrders.textContent   = allOrders.length;
  }

  /* ══ PRODUCTS TABLE ══ */
  function renderTable() {
    let list = [...allProducts];
    if (adminCatFilter !== 'all') list = list.filter(p => p.category === adminCatFilter);
    if (adminSearch) {
      const q = adminSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    if (!list.length) {
      adminTbody.innerHTML = '';
      adminEmpty.style.display = 'block';
      return;
    }
    adminEmpty.style.display = 'none';

    adminTbody.innerHTML = list.map(p => {
      const imgCell = p.image
        ? `<img src="${p.image}" class="table-img" alt="${esc(p.name)}" onerror="this.style.display='none'" />`
        : `<div class="table-img-placeholder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>`;
      const stockBadge = p.stock > 0
        ? `<span class="stock-badge in">${p.stock}</span>`
        : `<span class="stock-badge out">Out</span>`;

      return `<tr>
        <td>${imgCell}</td>
        <td><span class="table-name">${esc(p.name)}</span></td>
        <td><span class="table-cat">${esc(p.category)}</span></td>
        <td>${JazoAPI.formatPrice(p.price)}</td>
        <td>${stockBadge}</td>
        <td>${p.featured ? '<span class="featured-check">★</span>' : '<span class="featured-dash">—</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit-btn" data-id="${p.id}">Edit</button>
            <button class="action-btn del del-btn" data-id="${p.id}" data-name="${esc(p.name)}">Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    adminTbody.querySelectorAll('.edit-btn').forEach(btn =>
      btn.addEventListener('click', () => startEdit(btn.dataset.id))
    );
    adminTbody.querySelectorAll('.del-btn').forEach(btn =>
      btn.addEventListener('click', () => confirmDelete(btn.dataset.id, btn.dataset.name))
    );
  }

  adminSearchI.addEventListener('input', e => { adminSearch = e.target.value.trim(); renderTable(); });
  adminCatSel.addEventListener('change', e => { adminCatFilter = e.target.value; renderTable(); });

  /* ══ ORDERS ══ */
  function renderOrders() {
    if (!allOrders.length) {
      if (ordersTbody) ordersTbody.innerHTML = '';
      if (ordersEmpty) ordersEmpty.style.display = 'block';
      return;
    }
    if (ordersEmpty) ordersEmpty.style.display = 'none';
    if (!ordersTbody) return;

    ordersTbody.innerHTML = allOrders.map(o => {
      const date = new Date(o.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
      const statusClass = o.status === 'delivered' ? 'status-done' : o.status === 'cancelled' ? 'status-cancel' : 'status-pending';

      return `
        <tr class="order-row" data-order-id="${esc(o.id)}">
          <td><strong>${esc(o.id)}</strong></td>
          <td>${esc(o.customer.name)}<br><small>${esc(o.customer.phone)}</small></td>
          <td>${o.items.map(i => `${esc(i.name)}${i.model ? ` (${esc(i.model)})` : ''} x${i.qty}`).join('<br>')}</td>
          <td>${JazoAPI.formatPrice(o.total)}</td>
          <td><span class="order-status ${statusClass}">${esc(o.status)}</span></td>
          <td>${date}</td>
          <td>
            <select class="status-select admin-select" data-id="${o.id}">
              <option value="pending"   ${o.status==='pending'   ?'selected':''}>Pending</option>
              <option value="confirmed" ${o.status==='confirmed' ?'selected':''}>Confirmed</option>
              <option value="delivered" ${o.status==='delivered' ?'selected':''}>Delivered</option>
              <option value="cancelled" ${o.status==='cancelled' ?'selected':''}>Cancelled</option>
            </select>
          </td>
        </tr>
        <tr class="order-detail-row" data-detail-for="${esc(o.id)}">
          <td colspan="7">
            <div class="order-detail-panel" id="detail-${esc(o.id)}">
              <div class="order-detail-col">
                <span class="order-detail-label">Full Name</span>
                <span class="order-detail-value">${esc(o.customer.name)}</span>
              </div>
              <div class="order-detail-col">
                <span class="order-detail-label">Phone</span>
                <span class="order-detail-value">${esc(o.customer.phone)}</span>
              </div>
              <div class="order-detail-col">
                <span class="order-detail-label">Delivery Address</span>
                <span class="order-detail-value">${esc(o.customer.address || '—')}</span>
              </div>
              <div class="order-detail-col">
                <span class="order-detail-label">Note</span>
                <span class="order-detail-value ${o.customer.note ? '' : 'empty'}">${esc(o.customer.note || 'No note')}</span>
              </div>
            </div>
          </td>
        </tr>`;
    }).join('');

    ordersTbody.querySelectorAll('.order-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('select')) return;
        const orderId = row.dataset.orderId;
        const panel = document.getElementById('detail-' + orderId);
        const isOpen = panel.classList.contains('open');
        ordersTbody.querySelectorAll('.order-detail-panel').forEach(p => p.classList.remove('open'));
        ordersTbody.querySelectorAll('.order-row').forEach(r => r.classList.remove('expanded'));
        if (!isOpen) {
          panel.classList.add('open');
          row.classList.add('expanded');
        }
      });
    });

    ordersTbody.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        try {
          await JazoAPI.updateOrderStatus(sel.dataset.id, sel.value);
          const idx = allOrders.findIndex(o => o.id === sel.dataset.id);
          if (idx !== -1) allOrders[idx].status = sel.value;
          showToast('Order status updated');
          renderOrders();
        } catch { showToast('Failed to update status'); }
      });
    });
  }

  /* ══ BRAND / MODEL SELECTOR ══ */
  function renderModelGrid(brand, selected = []) {
    if (!brand || !MODELS[brand]) {
      modelCheckboxes.style.display = 'none';
      modelGrid.innerHTML = '';
      return;
    }
    modelCheckboxes.style.display = 'block';
    modelGrid.innerHTML = MODELS[brand].map(model => `
      <label class="model-check-label">
        <input type="checkbox" name="model" value="${model}" ${selected.includes(model) ? 'checked' : ''} />
        ${brand === 'iphone' ? 'iPhone ' : 'Samsung '}${model}
      </label>
    `).join('');
  }

  pBrand.addEventListener('change', () => renderModelGrid(pBrand.value));

  /* ══ PRODUCT FORM ══ */
  function resetForm() {
    editingId       = null;
    pendingFiles    = [];
    pendingExisting = [];
    productForm.reset();
    editIdField.value     = '';
    formTitle.textContent = 'Add Product';
    submitBtn.textContent = 'Add Product';
    cancelEdit.style.display = 'none';
    formError.textContent = '';
    pBrand.value = '';
    renderModelGrid('');
    renderImageGrid();
  }

  function startEdit(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    editingId       = id;
    pendingFiles    = [];
    pendingExisting = (p.images && p.images.length) ? [...p.images] : (p.image ? [p.image] : []);

    formTitle.textContent    = 'Edit Product';
    submitBtn.textContent    = 'Save Changes';
    cancelEdit.style.display = 'inline-flex';
    editIdField.value        = id;
    pName.value       = p.name;
    pCategory.value   = p.category;
    pDesc.value       = p.description;
    pPrice.value      = p.price;
    pOldPrice.value   = p.old_price || '';
    pStock.value      = p.stock;
    pFeatured.checked = p.featured;
    pNew.checked      = p.is_new;
    pBrand.value      = p.brand || '';
    renderModelGrid(p.brand || '', p.model_options || []);
    formError.textContent = '';
    renderImageGrid();

    /* show existing images as previews */
    const existingImages = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
    existingImages.forEach(url => {
      const wrap = document.createElement('div');
      wrap.className = 'img-thumb-wrap';
      const img = document.createElement('img');
      img.src = url;
      const removeBtn = document.createElement('button');
      removeBtn.className = 'img-thumb-remove';
      removeBtn.type = 'button';
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', () => {
        wrap.remove();
        pendingExisting = pendingExisting.filter(u => u !== url);
      });
      wrap.appendChild(img);
      wrap.appendChild(removeBtn);
      imgUploadGrid.insertBefore(wrap, imgAddBtn);
    });

    navItems.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-view="add"]').classList.add('active');
    switchView('add');
    document.querySelector('.admin-main').scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit.addEventListener('click', () => {
    resetForm();
    navItems.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-view="products"]').classList.add('active');
    switchView('products');
  });

  resetBtn.addEventListener('click', resetForm);

  productForm.addEventListener('submit', async e => {
    e.preventDefault();
    formError.textContent = '';

    if (!pName.value.trim() || !pCategory.value || !pDesc.value.trim() || !pPrice.value || !pStock.value) {
      formError.textContent = 'Please fill in all required fields.';
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = editingId ? 'Saving…' : 'Adding…';

    try {
      let imageUrls = [];
      if (pendingFiles.length) {
        submitBtn.textContent = 'Uploading images…';
        imageUrls = await Promise.all(pendingFiles.map(f => JazoAPI.uploadImage(f)));
      }
      imageUrls = [...pendingExisting, ...imageUrls];

      const selectedModels = Array.from(
        modelGrid.querySelectorAll('input[name="model"]:checked')
      ).map(i => i.value);

      const payload = {
        name:          pName.value.trim(),
        category:      pCategory.value,
        description:   pDesc.value.trim(),
        price:         Number(pPrice.value),
        old_price:     pOldPrice.value ? Number(pOldPrice.value) : null,
        stock:         Number(pStock.value),
        featured:      pFeatured.checked,
        is_new:        pNew.checked,
        image:         imageUrls[0] || '',
        images:        imageUrls,
        brand:         pBrand.value || '',
        model_options: selectedModels,
      };

      if (editingId) {
        const updated = await JazoAPI.updateProduct(editingId, payload);
        const idx = allProducts.findIndex(p => p.id === editingId);
        if (idx !== -1) allProducts[idx] = updated;
        showToast('Product updated');
      } else {
        const created = await JazoAPI.addProduct(payload);
        allProducts.unshift(created);
        showToast('Product added');
      }

      updateStats();
      resetForm();
      navItems.forEach(b => b.classList.remove('active'));
      document.querySelector('[data-view="products"]').classList.add('active');
      switchView('products');

    } catch (err) {
      formError.textContent = err.message || 'Failed to save product.';
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = editingId ? 'Save Changes' : 'Add Product';
    }
  });

  /* ══ IMAGE UPLOAD GRID ══ */
  const imgAddBtn     = document.getElementById('img-add-btn');
  const imgUploadGrid = document.getElementById('img-upload-grid');

  imgAddBtn.addEventListener('click', () => pImageFile.click());

  pImageFile.addEventListener('change', e => {
    Array.from(e.target.files).forEach(file => {
      if (file.type.startsWith('image/')) pendingFiles.push(file);
    });
    pImageFile.value = '';
    renderImageGrid();
  });

  function renderImageGrid() {
    imgUploadGrid.querySelectorAll('.img-thumb-wrap').forEach(el => el.remove());
    pendingFiles.forEach((file, i) => {
      const wrap      = document.createElement('div');
      wrap.className  = 'img-thumb-wrap';
      const img       = document.createElement('img');
      img.src         = URL.createObjectURL(file);
      const removeBtn = document.createElement('button');
      removeBtn.className = 'img-thumb-remove';
      removeBtn.type      = 'button';
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', () => {
        pendingFiles.splice(i, 1);
        renderImageGrid();
      });
      wrap.appendChild(img);
      wrap.appendChild(removeBtn);
      imgUploadGrid.insertBefore(wrap, imgAddBtn);
    });
  }

  /* ══ DELETE ══ */
  function confirmDelete(id, name) {
    deleteTarget = id;
    delName.textContent = name;
    delOverlay.classList.add('active');
  }

  delConfirm.addEventListener('click', async () => {
    if (!deleteTarget) return;
    try {
      await JazoAPI.deleteProduct(deleteTarget);
      allProducts  = allProducts.filter(p => p.id !== deleteTarget);
      deleteTarget = null;
      delOverlay.classList.remove('active');
      updateStats();
      renderTable();
      showToast('Product deleted');
    } catch { showToast('Failed to delete product'); }
  });

  delCancel.addEventListener('click', () => { deleteTarget = null; delOverlay.classList.remove('active'); });
  delOverlay.addEventListener('click', e => {
    if (e.target === delOverlay) { deleteTarget = null; delOverlay.classList.remove('active'); }
  });

  /* ══ TOAST ══ */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ══ MOBILE SIDEBAR ══ */
  const adminHamburger = document.getElementById('admin-hamburger');
  const sidebar        = document.querySelector('.sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  if (adminHamburger) {
    adminHamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
    });
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
      });
    });
  }

  /* ══ BOOT ══ */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById('view-products').style.display = 'flex';
    checkAuth();
  });

})();