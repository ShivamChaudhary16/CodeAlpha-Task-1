/**
 * Cart & Toast Management Module
 */

function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button style="color:rgba(255,255,255,0.8);font-size:1.1rem;cursor:pointer;" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

const Cart = {
  storageKey: 'lumina_cart',

  getItems() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveItems(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    this.updateUI();
  },

  addItem(product, quantity = 1) {
    const items = this.getItems();
    const existing = items.find((item) => item.productId === product.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        original_price: product.original_price ? parseFloat(product.original_price) : null,
        image: product.image,
        quantity: quantity
      });
    }

    this.saveItems(items);
    showToast(`Added "${product.name}" to your cart!`, 'success');
    this.openDrawer();
  },

  updateQuantity(productId, delta) {
    let items = this.getItems();
    const item = items.find((i) => i.productId === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      items = items.filter((i) => i.productId !== productId);
      showToast('Item removed from cart', 'info');
    }
    this.saveItems(items);
  },

  removeItem(productId) {
    const items = this.getItems().filter((i) => i.productId !== productId);
    this.saveItems(items);
    showToast('Item removed from cart', 'info');
  },

  clearCart() {
    localStorage.removeItem(this.storageKey);
    this.updateUI();
  },

  getCount() {
    return this.getItems().reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal() {
    return this.getItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getShippingFee() {
    const subtotal = this.getSubtotal();
    return (subtotal >= 100 || subtotal === 0) ? 0 : 9.99;
  },

  getTax() {
    return parseFloat((this.getSubtotal() * 0.08).toFixed(2));
  },

  getTotal() {
    return parseFloat((this.getSubtotal() + this.getShippingFee() + this.getTax()).toFixed(2));
  },

  updateUI() {
    this.renderBadge();
    this.renderDrawer();
    // Dispatch custom event so checkout page can re-render if open
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: this.getCount() } }));
  },

  renderBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.getCount();
    badges.forEach((badge) => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  renderDrawer() {
    const list = document.getElementById('drawerCartItems');
    const subtotalEl = document.getElementById('drawerSubtotal');
    const shippingEl = document.getElementById('drawerShipping');
    const totalEl = document.getElementById('drawerTotal');
    const shippingProgressEl = document.getElementById('drawerShippingProgress');
    const shippingNoticeEl = document.getElementById('drawerShippingNotice');
    const countHeaderEl = document.getElementById('drawerCountHeader');
    const emptyStateEl = document.getElementById('drawerEmptyState');
    const checkoutBtn = document.getElementById('drawerCheckoutBtn');

    if (!list) return;

    const items = this.getItems();
    const count = this.getCount();
    const subtotal = this.getSubtotal();

    if (countHeaderEl) countHeaderEl.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;

    // Free shipping threshold: $100
    if (shippingProgressEl && shippingNoticeEl) {
      if (subtotal >= 100) {
        shippingNoticeEl.innerHTML = '🎉 You qualify for <strong>FREE standard shipping!</strong>';
        shippingProgressEl.style.width = '100%';
      } else if (subtotal > 0) {
        const remaining = (100 - subtotal).toFixed(2);
        shippingNoticeEl.innerHTML = `Add <strong>$${remaining}</strong> more to unlock <strong>FREE Shipping</strong>`;
        const percentage = Math.min(100, Math.round((subtotal / 100) * 100));
        shippingProgressEl.style.width = `${percentage}%`;
      } else {
        shippingNoticeEl.innerHTML = 'Free standard shipping on orders over <strong>$100.00</strong>';
        shippingProgressEl.style.width = '0%';
      }
    }

    if (items.length === 0) {
      if (emptyStateEl) emptyStateEl.style.display = 'block';
      list.innerHTML = '';
      if (checkoutBtn) checkoutBtn.setAttribute('disabled', 'true');
    } else {
      if (emptyStateEl) emptyStateEl.style.display = 'none';
      if (checkoutBtn) checkoutBtn.removeAttribute('disabled');

      list.innerHTML = items.map((item) => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://placehold.co/100x100?text=Item'" />
          <div class="cart-item-details">
            <a href="/product.html?id=${item.productId}" class="cart-item-title">${item.name}</a>
            <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            <div class="cart-item-controls">
              <div class="quantity-stepper">
                <button type="button" onclick="Cart.updateQuantity(${item.productId}, -1)">−</button>
                <span>${item.quantity}</span>
                <button type="button" onclick="Cart.updateQuantity(${item.productId}, 1)">+</button>
              </div>
              <button type="button" class="btn-remove-item" onclick="Cart.removeItem(${item.productId})" title="Remove item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = this.getShippingFee() === 0 ? 'FREE' : `$${this.getShippingFee().toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${this.getTotal().toFixed(2)}`;
  },

  openDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (overlay && drawer) {
      overlay.classList.add('active');
      drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.renderDrawer();
    }
  },

  closeDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (overlay && drawer) {
      overlay.classList.remove('active');
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  init() {
    this.updateUI();

    // Setup Drawer trigger listeners
    const openBtns = document.querySelectorAll('.btn-open-cart');
    openBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    });

    const closeBtn = document.getElementById('btnCloseDrawer');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }

    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeDrawer();
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
});
