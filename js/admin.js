/* ═══════════════════════════════════════════
   ROZINA SIGNATURE LIVING — Admin JS (Vercel/Supabase)
   ═══════════════════════════════════════════ */

(() => {
  'use strict';

  const CREDS    = { user: 'admin', pass: 'jazo2025' };
  const AUTH_KEY = 'jazo_auth';

  let editingId      = null;
  let deleteTarget   = null;
  let adminSearch    = '';
  let adminCatFilter = 'all';
  let allProducts    = [];
  let allOrders      = [];
  let pendingFile    = null;   // File object waiting to be uploaded
  let toastTimer;

  /* ── DOM ── */
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
  const pImageUrl    = document.getElementById('p-image-url');
  const pImageFile   = document.getElementById('p-image-file');
  const fileDrop     = document.getElementById('file-drop');
  const imgPreviewW  = document.getElementById('image-preview-wrap');
  const imgPreview   = document.getElementById('image-preview');
  const removeImgBtn = document.getElementById('remove-img-btn');

  const delOverlay   = document.getElementById('del-overlay');
  const delName      = document.getElementById('del-name');
  const delConfirm   = document.getElementById('del-confirm');
  const delCancel    = document.getElementById('del-cancel');

  const ordersTbody  = document.getElementById('orders-tbody');
  const ordersEmpty  = document.getElementById('orders-empty');

  /* ══════════════ AUTH ══════════════ */
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

  /* ══════════════ DATA ══════════════ */
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

  /* ══════════════ NAV ══════════════ */
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

  /* ══════════════ STATS ══════════════ */
  function updateStats() {
    statTotal.textContent    = allProducts.length;
    statStock.textContent    = allProducts.filter(p => p.stock > 0).length;
    statFeatured.textContent = allProducts.filter(p => p.featured).length;
    statOrders.textContent   = allOrders.length;
  }

  /* ══════════════ PRODUCTS TABLE ══════════════ */
  function renderTable() {
    let list = [...allProducts];
    if (adminCatFilter !== 'all') list = list.filter(p => p.category === adminCatFilter);
    if (adminSearch) {
      const q = adminSearch.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
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

  /* ══════════════ ORDERS ══════════════ */
  function renderOrders() {
    if (!allOrders.length) {
      if (ordersTbody) ordersTbody.innerHTML = '';
      if (ordersEmpty) ordersEmpty.style.display = 'block';
      return;
    }
    if (ordersEmpty) ordersEmpty.style.display = 'none';
    if (!ordersTbody) return;

    ordersTbody.innerHTML = allOrders.map(o => {
      const date = new Date(o.created_at).toLocaleDateString('en-KE', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      const statusClass = o.status === 'delivered' ? 'status-done'
        : o.status === 'cancelled' ? 'status-cancel' : 'status-pending';

      return `<tr>
        <td><strong>${esc(o.id)}</strong></td>
        <td>${esc(o.customer.name)}<br><small>${esc(o.customer.phone)}</small></td>
        <td>${o.items.map(i => `${esc(i.name)} ×${i.qty}`).join('<br>')}</td>
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
      </tr>`;
    }).join('');

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

  /* ══════════════ PRODUCT FORM ══════════════ */
  function resetForm() {
    editingId  = null;
    pendingFile = null;
    productForm.reset();
    editIdField.value = '';
    formTitle.textContent = 'Add Product';
    submitBtn.textContent = 'Add Product';
    cancelEdit.style.display = 'none';
    formError.textContent = '';
    imgPreviewW.style.display = 'none';
    imgPreview.src = '';
  }

  function startEdit(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    editingId   = id;
    pendingFile = null;
    formTitle.textContent  = 'Edit Product';
    submitBtn.textContent  = 'Save Changes';
    cancelEdit.style.display = 'inline-flex';
    editIdField.value = id;

    pName.value       = p.name;
    pCategory.value   = p.category;
    pDesc.value       = p.description;
    pPrice.value      = p.price;
    pOldPrice.value   = p.old_price || '';
    pStock.value      = p.stock;
    pFeatured.checked = p.featured;
    pNew.checked      = p.is_new;
    pImageUrl.value   = p.image && !p.image.includes('supabase') ? p.image : '';

    if (p.image) { imgPreview.src = p.image; imgPreviewW.style.display = 'flex'; }
    else imgPreviewW.style.display = 'none';

    formError.textContent = '';
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

    submitBtn.disabled = true;
    submitBtn.textContent = editingId ? 'Saving…' : 'Adding…';

    try {
      // Upload image file to Supabase Storage if one was selected
      let imageUrl = pImageUrl.value.trim();
      if (pendingFile) {
        submitBtn.textContent = 'Uploading image…';
        imageUrl = await JazoAPI.uploadImage(pendingFile);
      }

      const payload = {
        name:        pName.value.trim(),
        category:    pCategory.value,
        description: pDesc.value.trim(),
        price:       Number(pPrice.value),
        old_price:   pOldPrice.value ? Number(pOldPrice.value) : null,
        stock:       Number(pStock.value),
        featured:    pFeatured.checked,
        is_new:      pNew.checked,
        image:       imageUrl,
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
      submitBtn.disabled = false;
      submitBtn.textContent = editingId ? 'Save Changes' : 'Add Product';
    }
  });

  /* ── Image selection ── */
  function setImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    pendingFile = file;
    imgPreview.src = URL.createObjectURL(file);
    imgPreviewW.style.display = 'flex';
    pImageUrl.value = '';
  }

  pImageFile.addEventListener('change', e => setImageFile(e.target.files[0]));

  fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.style.borderColor = 'var(--gold)'; });
  fileDrop.addEventListener('dragleave', () => { fileDrop.style.borderColor = ''; });
  fileDrop.addEventListener('drop', e => {
    e.preventDefault();
    fileDrop.style.borderColor = '';
    setImageFile(e.dataTransfer.files[0]);
  });

  pImageUrl.addEventListener('input', () => {
    if (pImageUrl.value.trim()) {
      pendingFile = null;
      imgPreview.src = pImageUrl.value.trim();
      imgPreviewW.style.display = 'flex';
    } else {
      imgPreviewW.style.display = 'none';
    }
  });

  removeImgBtn.addEventListener('click', () => {
    pendingFile = null;
    imgPreview.src = '';
    imgPreviewW.style.display = 'none';
    pImageUrl.value = '';
    pImageFile.value = '';
  });

  /* ══════════════ DELETE ══════════════ */
  function confirmDelete(id, name) {
    deleteTarget = id;
    delName.textContent = name;
    delOverlay.classList.add('active');
  }

  delConfirm.addEventListener('click', async () => {
    if (!deleteTarget) return;
    try {
      await JazoAPI.deleteProduct(deleteTarget);
      allProducts = allProducts.filter(p => p.id !== deleteTarget);
      deleteTarget = null;
      delOverlay.classList.remove('active');
      updateStats();
      renderTable();
      showToast('Product deleted');
    } catch { showToast('Failed to delete product'); }
  });

  delCancel.addEventListener('click', () => {
    deleteTarget = null;
    delOverlay.classList.remove('active');
  });
  delOverlay.addEventListener('click', e => {
    if (e.target === delOverlay) { deleteTarget = null; delOverlay.classList.remove('active'); }
  });

  /* ══════════════ TOAST ══════════════ */
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

  /* ══════════════ BOOT ══════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById('view-products').style.display = 'flex';
    checkAuth();
  });
})();
