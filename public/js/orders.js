/**
 * User Order History Controller (orders.html)
 */

async function loadUserOrders() {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  if (!Auth.isLoggedIn()) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <h3>Sign In to View Orders</h3>
        <p>Please log in to your account to track your current orders and view past purchase history.</p>
        <button class="btn btn-primary" onclick="Auth.openModal('login')">Sign In Now</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid #E5E7EB; border-top-color: var(--accent-cta); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 12px; color: var(--text-secondary); font-size: 0.9rem;">Fetching your orders...</p>
    </div>
  `;

  try {
    const data = await API.getMyOrders();
    const orders = data.orders || [];

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <h3>No Orders Found</h3>
          <p>You haven't placed any orders yet. Discover our latest collection and start shopping today!</p>
          <a href="/index.html" class="btn btn-primary">Start Shopping</a>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map((order) => {
      const dateStr = new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <div class="order-card-record">
          <div class="order-card-header">
            <div class="order-meta-col">
              <span class="label">Order Number</span>
              <span class="val" style="color: var(--accent-cta); font-family: monospace;">${order.order_number}</span>
            </div>
            <div class="order-meta-col">
              <span class="label">Date Placed</span>
              <span class="val">${dateStr}</span>
            </div>
            <div class="order-meta-col">
              <span class="label">Total Amount</span>
              <span class="val">$${order.total.toFixed(2)}</span>
            </div>
            <div class="order-meta-col">
              <span class="label">Status</span>
              <span class="status-pill confirmed">● ${order.status || 'Confirmed'}</span>
            </div>
          </div>

          <div class="order-items-table">
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 12px;">
              Shipped to: <strong>${order.customer_name}</strong> &bull; ${order.shipping_address}, ${order.shipping_city} (${order.payment_method})
            </div>
            ${(order.items || []).map((item) => `
              <div class="order-item-line">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <img src="${item.product_image}" alt="${item.product_name}" class="order-item-thumb" onerror="this.src='https://placehold.co/100x100?text=Item'" />
                  <div>
                    <a href="/product.html?id=${item.product_id}" style="font-weight: 700; font-size: 0.92rem; color: var(--text-primary);">${item.product_name}</a>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Qty: ${item.quantity} &times; $${item.product_price.toFixed(2)}</div>
                  </div>
                </div>
                <div style="font-weight: 700; font-size: 0.95rem;">
                  $${(item.quantity * item.product_price).toFixed(2)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load orders:', err);
    container.innerHTML = `
      <div class="empty-state">
        <h3>Could not load orders</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadUserOrders();
});
