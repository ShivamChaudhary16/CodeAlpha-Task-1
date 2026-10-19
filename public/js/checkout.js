/**
 * Checkout & Order Processing Controller (checkout.html)
 */

let appliedDiscountPercent = 0;

function renderCheckoutSummary() {
  const listEl = document.getElementById('checkoutSummaryItems');
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const discountRowEl = document.getElementById('checkoutDiscountRow');
  const discountValEl = document.getElementById('checkoutDiscountVal');
  const shippingEl = document.getElementById('checkoutShipping');
  const taxEl = document.getElementById('checkoutTax');
  const totalEl = document.getElementById('checkoutTotal');
  const placeOrderBtn = document.getElementById('btnPlaceOrder');

  const items = Cart.getItems();

  if (items.length === 0) {
    if (listEl) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
          Your cart is empty. <br/>
          <a href="/index.html" class="btn btn-primary btn-sm" style="margin-top: 10px;">Return to Shop</a>
        </div>
      `;
    }
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    return;
  }

  if (placeOrderBtn) placeOrderBtn.disabled = false;

  if (listEl) {
    listEl.innerHTML = items.map((item) => `
      <div class="summary-item-row">
        <img src="${item.image}" alt="${item.name}" class="summary-item-img" onerror="this.src='https://placehold.co/100x100?text=Item'" />
        <div class="summary-item-info">
          <div class="summary-item-title">${item.name}</div>
          <div class="summary-item-qty">Qty: ${item.quantity} &times; $${item.price.toFixed(2)}</div>
        </div>
        <div class="summary-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
      </div>
    `).join('');
  }

  const subtotal = Cart.getSubtotal();
  const discountAmount = appliedDiscountPercent > 0 ? (subtotal * (appliedDiscountPercent / 100)) : 0;
  const discountedSubtotal = subtotal - discountAmount;
  const shippingFee = (discountedSubtotal >= 100 || discountedSubtotal === 0) ? 0 : 9.99;
  const tax = parseFloat((discountedSubtotal * 0.08).toFixed(2));
  const finalTotal = parseFloat((discountedSubtotal + shippingFee + tax).toFixed(2));

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;

  if (discountRowEl && discountValEl) {
    if (appliedDiscountPercent > 0) {
      discountRowEl.style.display = 'flex';
      discountValEl.textContent = `-$${discountAmount.toFixed(2)} (${appliedDiscountPercent}%)`;
    } else {
      discountRowEl.style.display = 'none';
    }
  }

  if (shippingEl) shippingEl.textContent = shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${finalTotal.toFixed(2)}`;
}

function initCheckout() {
  renderCheckoutSummary();

  // Pre-fill user data if authenticated
  const user = Auth.getUser();
  if (user) {
    const nameInput = document.getElementById('custName');
    const emailInput = document.getElementById('custEmail');
    if (nameInput && !nameInput.value) nameInput.value = user.name;
    if (emailInput && !emailInput.value) emailInput.value = user.email;
  }

  // Payment Method Selection Toggle
  const methodCards = document.querySelectorAll('.payment-method-card');
  const cardDetails = document.getElementById('creditCardInputs');

  methodCards.forEach((card) => {
    card.addEventListener('click', () => {
      methodCards.forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      if (card.dataset.method === 'card') {
        if (cardDetails) cardDetails.style.display = 'block';
      } else {
        if (cardDetails) cardDetails.style.display = 'none';
      }
    });
  });

  // Promo Code Handler
  const promoBtn = document.getElementById('btnApplyPromo');
  const promoInput = document.getElementById('inputPromoCode');
  if (promoBtn && promoInput) {
    promoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'WELCOME10' || code === 'CODEALPHA' || code === 'SAVE10') {
        appliedDiscountPercent = 10;
        showToast('Promo code applied! 10% discount added.', 'success');
        renderCheckoutSummary();
      } else if (code === 'SAVE20') {
        appliedDiscountPercent = 20;
        showToast('Super saver code applied! 20% discount added.', 'success');
        renderCheckoutSummary();
      } else {
        showToast('Invalid promo code. Try "CODEALPHA" for 10% off.', 'error');
      }
    });
  }

  // Form Submission
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const items = Cart.getItems();
      if (items.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
      }

      const name = document.getElementById('custName').value.trim();
      const email = document.getElementById('custEmail').value.trim();
      const address = document.getElementById('custAddress').value.trim();
      const city = document.getElementById('custCity').value.trim();
      const zip = document.getElementById('custZip').value.trim();
      const selectedPaymentEl = document.querySelector('input[name="paymentMethod"]:checked');
      const paymentMethod = selectedPaymentEl ? selectedPaymentEl.value : 'Credit Card';

      const submitBtn = document.getElementById('btnPlaceOrder');

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px; margin-right: 8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="4" stroke="currentColor" stroke-dasharray="32" stroke-linecap="round"></circle>
          </svg>
          Processing Order...
        `;

        const payload = {
          customerName: name,
          customerEmail: email,
          shippingAddress: address,
          shippingCity: city,
          shippingZip: zip,
          paymentMethod: paymentMethod,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
        };

        const res = await API.createOrder(payload);

        // Clear cart
        Cart.clearCart();

        // Show Confirmation View
        showOrderConfirmation(res.order);
      } catch (err) {
        showToast(err.message || 'Failed to place order', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Place Order';
      }
    });
  }

  // Listen for cart changes
  window.addEventListener('cartUpdated', () => {
    renderCheckoutSummary();
  });
}

function showOrderConfirmation(order) {
  const checkoutSection = document.getElementById('checkoutMainSection');
  const confirmSection = document.getElementById('orderConfirmationSection');

  if (checkoutSection) checkoutSection.style.display = 'none';
  if (confirmSection) {
    confirmSection.style.display = 'block';

    const orderNumEl = document.getElementById('confOrderNumber');
    const orderTotalEl = document.getElementById('confOrderTotal');
    const orderEmailEl = document.getElementById('confCustomerEmail');
    const orderItemsEl = document.getElementById('confOrderItems');

    if (orderNumEl) orderNumEl.textContent = order.orderNumber;
    if (orderTotalEl) orderTotalEl.textContent = `$${order.total.toFixed(2)}`;
    if (orderEmailEl) orderEmailEl.textContent = order.customerEmail;

    if (orderItemsEl && order.items) {
      orderItemsEl.innerHTML = order.items.map((i) => `
        <div class="summary-item-row" style="margin-bottom: 10px;">
          <img src="${i.image}" class="summary-item-img" alt="${i.name}" />
          <div class="summary-item-info">
            <div class="summary-item-title">${i.name}</div>
            <div class="summary-item-qty">Qty: ${i.quantity} &times; $${i.price.toFixed(2)}</div>
          </div>
          <div class="summary-item-price">$${(i.price * i.quantity).toFixed(2)}</div>
        </div>
      `).join('');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCheckout();
});
