/**
 * Main Catalog Controller (index.html)
 */

let allProducts = [];
let currentCategory = 'All';
let currentSearch = '';
let currentSort = 'featured';

async function initCatalog() {
  const grid = document.getElementById('productsGrid');
  const categoryTabs = document.getElementById('categoryTabs');
  const searchInput = document.getElementById('navSearchInput');
  const heroSearchInput = document.getElementById('heroSearchInput');
  const sortSelect = document.getElementById('sortSelect');
  const countLabel = document.getElementById('productCountLabel');

  try {
    // 1. Load Categories
    const catData = await API.getCategories();
    if (categoryTabs && catData.categories) {
      const tabsHtml = `
        <button class="category-tab active" data-category="All">All Items</button>
        ${catData.categories.map((c) => `
          <button class="category-tab" data-category="${c.category}">
            ${c.category} (${c.count})
          </button>
        `).join('')}
      `;
      categoryTabs.innerHTML = tabsHtml;

      // Category tab click event
      categoryTabs.querySelectorAll('.category-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          categoryTabs.querySelectorAll('.category-tab').forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');
          currentCategory = tab.dataset.category;
          renderFilteredProducts();
        });
      });
    }

    // 2. Load Products
    const prodData = await API.getProducts();
    allProducts = prodData.products || [];
    renderFilteredProducts();

    // 3. Search Inputs Handling (Navbar and Hero search)
    const handleSearch = (val) => {
      currentSearch = val.toLowerCase().trim();
      renderFilteredProducts();
    };

    if (searchInput) {
      searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    }
    if (heroSearchInput) {
      heroSearchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
        if (searchInput) searchInput.value = e.target.value;
      });
    }

    // 4. Sort Handling
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderFilteredProducts();
      });
    }
  } catch (err) {
    console.error('Failed to initialize catalog:', err);
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>Failed to load products</h3>
          <p>Please check your server connection and refresh.</p>
        </div>
      `;
    }
  }
}

function renderFilteredProducts() {
  const grid = document.getElementById('productsGrid');
  const countLabel = document.getElementById('productCountLabel');
  if (!grid) return;

  let filtered = [...allProducts];

  // Category filter
  if (currentCategory !== 'All') {
    filtered = filtered.filter((p) => p.category === currentCategory);
  }

  // Search filter
  if (currentSearch) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(currentSearch) ||
        p.description.toLowerCase().includes(currentSearch) ||
        p.category.toLowerCase().includes(currentSearch)
    );
  }

  // Sorting
  if (currentSort === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (currentSort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} products`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>No products found</h3>
        <p>Try searching for something else or browse another category.</p>
        <button class="btn btn-secondary btn-sm" onclick="resetFilters()">Clear Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((product) => {
    const discount = product.original_price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null;

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-card-img-wrap" onclick="viewProduct(${product.id})">
          ${discount ? `<div class="product-discount-badge">-${discount}%</div>` : ''}
          <div class="product-category-badge">${product.category}</div>
          <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://placehold.co/600x400?text=${encodeURIComponent(product.name)}'" />
        </div>
        <div class="product-card-body">
          <div class="product-rating">
            <span class="stars">★</span>
            <span class="rating-num">${product.rating.toFixed(1)}</span>
            <span class="rating-count">(${product.reviews_count})</span>
          </div>
          <h3 class="product-title" onclick="viewProduct(${product.id})">${product.name}</h3>
          <p class="product-desc-snippet">${product.description}</p>
          <div class="product-price-row">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            ${product.original_price ? `<span class="product-original-price">$${product.original_price.toFixed(2)}</span>` : ''}
          </div>
          <div class="product-card-actions">
            <button class="btn-add-cart" onclick="quickAddToCart(${product.id})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Add to Cart
            </button>
            <button class="btn-quick-view" onclick="openQuickView(${product.id})" title="Quick View">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function resetFilters() {
  currentCategory = 'All';
  currentSearch = '';
  currentSort = 'featured';

  const categoryTabs = document.querySelectorAll('.category-tab');
  categoryTabs.forEach((tab) => {
    if (tab.dataset.category === 'All') tab.classList.add('active');
    else tab.classList.remove('active');
  });

  const searchInput = document.getElementById('navSearchInput');
  const heroSearchInput = document.getElementById('heroSearchInput');
  if (searchInput) searchInput.value = '';
  if (heroSearchInput) heroSearchInput.value = '';

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = 'featured';

  renderFilteredProducts();
}

function viewProduct(id) {
  window.location.href = `/product.html?id=${id}`;
}

function quickAddToCart(id) {
  const product = allProducts.find((p) => p.id === id);
  if (product) {
    Cart.addItem(product, 1);
  }
}

// Quick View Modal
function openQuickView(id) {
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  const modal = document.getElementById('quickViewModalOverlay');
  const content = document.getElementById('quickViewContent');
  if (!modal || !content) return;

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1.1fr; gap: 24px; align-items: center;">
      <div>
        <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 280px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--border-color);" />
      </div>
      <div>
        <span class="detail-category-tag" style="margin-bottom: 8px;">${product.category}</span>
        <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px;">${product.name}</h3>
        <div class="product-rating" style="margin-bottom: 12px;">
          <span class="stars">★</span>
          <span class="rating-num">${product.rating.toFixed(1)}</span>
          <span class="rating-count">(${product.reviews_count} reviews)</span>
        </div>
        <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px;">
          <span style="font-size: 1.5rem; font-weight: 800; color: var(--accent-cta);">$${product.price.toFixed(2)}</span>
          ${product.original_price ? `<span style="font-size: 0.95rem; color: var(--text-light); text-decoration: line-through;">$${product.original_price.toFixed(2)}</span>` : ''}
          ${discount ? `<span class="detail-save-badge">Save ${discount}%</span>` : ''}
        </div>
        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">${product.description}</p>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary btn-block" onclick="quickAddToCart(${product.id}); closeQuickView();">
            Add to Cart
          </button>
          <a href="/product.html?id=${product.id}" class="btn btn-secondary">
            Full Details
          </a>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  const modal = document.getElementById('quickViewModalOverlay');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCatalog();

  const closeQuickBtn = document.getElementById('btnCloseQuickView');
  if (closeQuickBtn) closeQuickBtn.addEventListener('click', closeQuickView);

  const quickOverlay = document.getElementById('quickViewModalOverlay');
  if (quickOverlay) {
    quickOverlay.addEventListener('click', (e) => {
      if (e.target === quickOverlay) closeQuickView();
    });
  }
});
