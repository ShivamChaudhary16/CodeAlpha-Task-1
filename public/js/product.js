/**
 * Dedicated Product Details Controller (product.html)
 */

let currentProduct = null;
let currentQuantity = 1;

async function loadProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const container = document.getElementById('productDetailContainer');
  const relatedContainer = document.getElementById('relatedProductsGrid');

  if (!productId) {
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No product specified</h3>
          <p>Please browse our catalog to find items you love.</p>
          <a href="/index.html" class="btn btn-primary">Go to Catalog</a>
        </div>
      `;
    }
    return;
  }

  try {
    const data = await API.getProductById(productId);
    currentProduct = data.product;
    const related = data.related || [];

    document.title = `${currentProduct.name} — Lumina Store`;

    // Render Breadcrumb
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    const breadcrumbTitle = document.getElementById('breadcrumbTitle');
    if (breadcrumbCategory) breadcrumbCategory.textContent = currentProduct.category;
    if (breadcrumbTitle) breadcrumbTitle.textContent = currentProduct.name;

    // Render Product Details
    const discount = currentProduct.original_price
      ? Math.round(((currentProduct.original_price - currentProduct.price) / currentProduct.original_price) * 100)
      : null;

    container.innerHTML = `
      <div class="product-gallery">
        <img id="mainProductImg" class="main-product-img" src="${currentProduct.image}" alt="${currentProduct.name}" onerror="this.src='https://placehold.co/600x600?text=Product+Image'" />
      </div>

      <div class="product-detail-info">
        <span class="detail-category-tag">${currentProduct.category}</span>
        <h1 class="detail-title">${currentProduct.name}</h1>

        <div class="product-rating" style="margin-bottom: 16px;">
          <span class="stars" style="font-size: 1.1rem;">★★★★★</span>
          <span class="rating-num" style="font-size: 0.95rem;">${currentProduct.rating.toFixed(1)}</span>
          <span class="rating-count" style="font-size: 0.88rem;">• ${currentProduct.reviews_count} verified reviews</span>
          <span style="margin-left: auto; font-size: 0.85rem; font-weight: 700; color: #059669; background: #ECFDF5; padding: 2px 10px; border-radius: var(--radius-full);">
            In Stock (${currentProduct.stock} units left)
          </span>
        </div>

        <div class="detail-price-box">
          <span class="detail-price">$${currentProduct.price.toFixed(2)}</span>
          ${currentProduct.original_price ? `<span class="detail-original">$${currentProduct.original_price.toFixed(2)}</span>` : ''}
          ${discount ? `<span class="detail-save-badge">Save $${(currentProduct.original_price - currentProduct.price).toFixed(2)} (${discount}%)</span>` : ''}
        </div>

        <p class="detail-desc">${currentProduct.description}</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-primary);">
          Key Highlights & Specifications
        </h4>
        <ul class="features-list">
          ${(currentProduct.features || []).map((feat) => `
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              ${feat}
            </li>
          `).join('')}
        </ul>

        <div class="detail-actions-row">
          <div class="detail-quantity-box">
            <button type="button" id="btnQtyMinus">−</button>
            <input type="text" id="inputQty" value="1" readonly />
            <button type="button" id="btnQtyPlus">+</button>
          </div>
          <button type="button" class="btn btn-primary btn-lg" id="btnAddToCartDetail" style="flex: 1;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            Add to Cart
          </button>
          <button type="button" class="btn btn-gold btn-lg" id="btnBuyNowDetail">
            Buy Now
          </button>
        </div>

        <div class="detail-guarantees">
          <div class="guarantee-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            <span>Free Shipping over $100</span>
          </div>
          <div class="guarantee-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>2-Year Warranty</span>
          </div>
          <div class="guarantee-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            <span>30-Day Hassle-Free Returns</span>
          </div>
        </div>
      </div>
    `;

    // Quantity Handlers
    const minusBtn = document.getElementById('btnQtyMinus');
    const plusBtn = document.getElementById('btnQtyPlus');
    const qtyInput = document.getElementById('inputQty');

    minusBtn.addEventListener('click', () => {
      if (currentQuantity > 1) {
        currentQuantity--;
        qtyInput.value = currentQuantity;
      }
    });

    plusBtn.addEventListener('click', () => {
      if (currentQuantity < currentProduct.stock) {
        currentQuantity++;
        qtyInput.value = currentQuantity;
      } else {
        showToast(`Maximum stock limit reached (${currentProduct.stock})`, 'info');
      }
    });

    // Add To Cart
    const addCartBtn = document.getElementById('btnAddToCartDetail');
    addCartBtn.addEventListener('click', () => {
      Cart.addItem(currentProduct, currentQuantity);
    });

    // Buy Now
    const buyNowBtn = document.getElementById('btnBuyNowDetail');
    buyNowBtn.addEventListener('click', () => {
      Cart.addItem(currentProduct, currentQuantity);
      window.location.href = '/checkout.html';
    });

    // Render Related Products
    if (relatedContainer && related.length > 0) {
      relatedContainer.innerHTML = related.map((p) => `
        <div class="product-card" onclick="window.location.href='/product.html?id=${p.id}'" style="cursor: pointer;">
          <div class="product-card-img-wrap" style="padding-top: 75%;">
            <img src="${p.image}" alt="${p.name}" />
          </div>
          <div class="product-card-body">
            <div class="product-rating">
              <span class="stars">★</span>
              <span class="rating-num">${p.rating.toFixed(1)}</span>
            </div>
            <h4 class="product-title" style="font-size: 0.95rem;">${p.name}</h4>
            <div class="product-price-row">
              <span class="product-price" style="font-size: 1.15rem;">$${p.price.toFixed(2)}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load product detail:', err);
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Product Not Found</h3>
          <p>The product you are looking for does not exist or has been removed.</p>
          <a href="/index.html" class="btn btn-primary">Return to Catalog</a>
        </div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProductDetail();
});
