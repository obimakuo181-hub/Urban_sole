let shoesData = [];

async function loadProductsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading products:", error);
    return;
  }

  shoesData = data.map(product => ({
    id: product.id,
    name: product.name,
    rawPrice: Number(product.price),
    price: `₦${Number(product.price).toLocaleString()}`,
    badge: product.status === "available" ? "New" : "",
    badgeClass: product.status === "available" ? "badge-dark" : "",
    image:
      Array.isArray(product.photos) && product.photos.length > 0
        ? product.photos[0]
        : "https://placehold.co/600x600",
    brand: product.brand,
    category: product.category,
    size: product.size,
    condition: product.condition,
    description: product.description,
    quantity: product.quantity,
    status: product.status
  }));

  renderShoes();
}

// =========================
// CART STORAGE
// =========================

// Load cart from browser storage
let cart = JSON.parse(localStorage.getItem("urbanSoleCart")) || [];

let currentFilter = "all";
let currentSearch = "";
let activeModalShoe = null;


// Save cart to browser storage
function saveCart() {
  localStorage.setItem("urbanSoleCart", JSON.stringify(cart));
}


// =========================
// PRODUCT RENDERING
// =========================

function renderShoes() {
  const gridContainer = document.getElementById("product-grid");
  const countSpan = document.getElementById("total-count");

  if (!gridContainer) return;

  const filteredShoes = shoesData.filter(shoe => {
    const matchesFilter =
      currentFilter === "all" || shoe.badge === currentFilter;

    const matchesSearch = shoe.name
      .toLowerCase()
      .includes(currentSearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (countSpan) {
    countSpan.textContent = filteredShoes.length;
  }

  if (filteredShoes.length === 0) {
    gridContainer.innerHTML = `
      <p style="grid-column: 1/-1; text-align: center; color: #777; padding: 40px 0;">
        No sneakers match your search.
      </p>
    `;

    return;
  }

  gridContainer.innerHTML = filteredShoes
    .map(
      shoe => `
        <div class="product-card" onclick="openProductModal(${shoe.id})">

          <div class="card-image-wrapper">

            <span class="badge ${shoe.badgeClass}">
              ${shoe.badge}
            </span>

            <img 
              src="${shoe.image}" 
              alt="${shoe.name}" 
              loading="lazy"
            >

            <span class="product-price-tag">
              ${shoe.price}
            </span>

          </div>

          <div class="card-info">

            <h3 class="product-name">
              ${shoe.name}
            </h3>

            <button
              class="add-to-cart-btn"
              onclick="event.stopPropagation(); addToCart(${shoe.id})"
            >
              Add to Cart
            </button>

          </div>

        </div>
      `
    )
    .join("");

  initScrollReveal();
}


// =========================
// PRODUCT MODAL
// =========================

function openProductModal(shoeId) {
  const shoe = shoesData.find(s => s.id === shoeId);

  if (!shoe) return;

  activeModalShoe = shoe;

  document.getElementById("modal-product-img").src = shoe.image;

  document.getElementById("modal-product-title").textContent =
    shoe.name;

  document.getElementById("modal-product-price").textContent =
    shoe.price;

  const badgeElem =
    document.getElementById("modal-product-badge");

  badgeElem.textContent = shoe.badge;

  badgeElem.className =
    `badge ${shoe.badgeClass}`;

  document
    .getElementById("product-modal-overlay")
    .classList.add("open");
}


function closeProductModal() {
  document
    .getElementById("product-modal-overlay")
    .classList.remove("open");
}


// =========================
// ADD TO CART
// =========================

function addToCart(shoeId) {
  const shoe = shoesData.find(item => item.id === shoeId);

  if (!shoe) return;

  const existingIndex =
    cart.findIndex(item => item.id === shoeId);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({
      ...shoe,
      quantity: 1
    });
  }

  saveCart();

  updateCartUI();

  toggleCart(true);

  showToast(`Added ${shoe.name} to cart!`);
}


// =========================
// TOAST NOTIFICATION
// =========================

function showToast(message) {
  const existingToast =
    document.getElementById("toast-notification");

  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");

  toast.id = "toast-notification";
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}


// =========================
// CHANGE QUANTITY
// =========================

function changeQuantity(index, amount) {
  if (!cart[index]) return;

  cart[index].quantity += amount;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart();

  updateCartUI();
}


// =========================
// REMOVE FROM CART
// =========================

function removeFromCart(index) {
  if (!cart[index]) return;

  cart.splice(index, 1);

  saveCart();

  updateCartUI();
}


// =========================
// UPDATE CART UI
// =========================

function updateCartUI() {
  const cartBadge =
    document.getElementById("cart-badge");

  const drawerCount =
    document.getElementById("cart-drawer-count");

  const cartItemsContainer =
    document.getElementById("cart-items");

  const cartSubtotal =
    document.getElementById("cart-subtotal-price");

  if (!cartItemsContainer) return;


  // Count TOTAL number of items
  const totalQuantity = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );


  // Update cart badge
  if (cartBadge) {
    cartBadge.textContent = totalQuantity;
  }


  // Update drawer count
  if (drawerCount) {
    drawerCount.textContent = totalQuantity;
  }


  // Empty cart
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <p class="empty-cart-msg">
        Your cart is currently empty.
      </p>
    `;

    if (cartSubtotal) {
      cartSubtotal.textContent = "$0.00";
    }

    return;
  }


  // Calculate subtotal
  let total = 0;


  cartItemsContainer.innerHTML = cart
    .map((item, index) => {

      const itemTotal =
        item.rawPrice * item.quantity;

      total += itemTotal;

      return `
        <div class="cart-item-row">

          <div class="cart-item-info">

            <h4>
              ${item.name}
            </h4>

            <p>
              $${item.rawPrice.toFixed(2)} each
            </p>

            <div class="cart-quantity-controls">

              <button
                class="quantity-btn"
                onclick="changeQuantity(${index}, -1)"
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span class="cart-quantity">
                ${item.quantity}
              </span>

              <button
                class="quantity-btn"
                onclick="changeQuantity(${index}, 1)"
                aria-label="Increase quantity"
              >
                +
              </button>

            </div>

          </div>

          <div class="cart-item-actions">

            <strong class="cart-item-total">
              $${itemTotal.toFixed(2)}
            </strong>

            <button
              class="cart-item-remove"
              onclick="removeFromCart(${index})"
            >
              Remove
            </button>

          </div>

        </div>
      `;
    })
    .join("");


  // Update subtotal
  if (cartSubtotal) {
    cartSubtotal.textContent =
      `$${total.toFixed(2)}`;
  }
}


// =========================
// CART DRAWER
// =========================

function toggleCart(open) {
  const drawer =
    document.getElementById("cart-drawer");

  const overlay =
    document.getElementById("cart-overlay");

  if (!drawer || !overlay) return;

  if (open) {
    drawer.classList.add("open");
    overlay.classList.add("open");
  } else {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
  }
}


// =========================
// EVENT LISTENERS
// =========================

document.addEventListener("DOMContentLoaded", () => {

  // Render products
  renderShoes();

  // Load saved cart into UI
  updateCartUI();

  // Initialize animations
  initScrollReveal();


  // =========================
  // SEARCH
  // =========================

  const searchToggleBtn =
    document.getElementById("search-toggle-btn");

  const searchInput =
    document.getElementById("search-input");


  searchInput?.addEventListener("input", (e) => {

    currentSearch = e.target.value;

    renderShoes();

  });


  searchToggleBtn?.addEventListener("click", () => {

    searchInput?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    searchInput?.focus();

  });


  // =========================
  // SHOP NAVBAR
  // =========================

  const navLinks =
    document.querySelectorAll(".nav-link");

  const shopLink = navLinks[1];


  shopLink?.addEventListener("click", (event) => {

    event.preventDefault();

    currentSearch = "";

    if (searchInput) {
      searchInput.value = "";
    }

    currentFilter = "all";


    const pillBtns =
      document.querySelectorAll(".pill-btn");

    pillBtns.forEach(btn => {
      btn.classList.remove("active");
    });


    const allButton =
      document.querySelector(
        '.pill-btn[data-filter="all"]'
      );

    allButton?.classList.add("active");


    renderShoes();


    document
      .getElementById("featured")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

  });


  // =========================
  // NEW ARRIVALS NAVBAR
  // =========================

  const newArrivalsLink = navLinks[2];


  newArrivalsLink?.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      currentSearch = "";

      if (searchInput) {
        searchInput.value = "";
      }

      currentFilter = "New";


      const pillBtns =
        document.querySelectorAll(".pill-btn");


      pillBtns.forEach(btn => {
        btn.classList.remove("active");
      });


      const newButton =
        document.querySelector(
          '.pill-btn[data-filter="New"]'
        );


      newButton?.classList.add("active");


      renderShoes();


      document
        .getElementById("featured")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

    }
  );


  // =========================
  // FILTER BUTTONS
  // =========================

  const pillBtns =
    document.querySelectorAll(".pill-btn");


  pillBtns.forEach(btn => {

    btn.addEventListener("click", () => {

      pillBtns.forEach(b => {
        b.classList.remove("active");
      });


      btn.classList.add("active");


      currentFilter =
        btn.dataset.filter;


      renderShoes();

    });

  });


  // =========================
  // PRODUCT MODAL
  // =========================

  document
    .getElementById("modal-add-btn")
    ?.addEventListener("click", () => {

      if (activeModalShoe) {

        addToCart(activeModalShoe.id);

        closeProductModal();

      }

    });


  document
    .getElementById("close-product-modal")
    ?.addEventListener(
      "click",
      closeProductModal
    );


  document
    .getElementById("product-modal-overlay")
    ?.addEventListener("click", (e) => {

      if (
        e.target.id ===
        "product-modal-overlay"
      ) {
        closeProductModal();
      }

    });


  // =========================
  // CART
  // =========================

  document
    .getElementById("cart-btn")
    ?.addEventListener("click", () => {

      toggleCart(true);

    });


  document
    .getElementById("close-cart-btn")
    ?.addEventListener("click", () => {

      toggleCart(false);

    });


  document
    .getElementById("cart-overlay")
    ?.addEventListener("click", () => {

      toggleCart(false);

    });


  // =========================
  // CHECKOUT
  // =========================

  const checkoutModal =
    document.getElementById(
      "checkout-modal-overlay"
    );


  document
    .getElementById("open-checkout-btn")
    ?.addEventListener("click", () => {

      if (cart.length === 0) {

        alert("Your cart is empty!");

        return;

      }


      // Calculate total INCLUDING quantities
      const total = cart.reduce(
        (sum, item) =>
          sum +
          item.rawPrice * item.quantity,
        0
      );


      document
        .getElementById(
          "checkout-total-price"
        )
        .textContent =
        `$${total.toFixed(2)}`;


      toggleCart(false);


      checkoutModal?.classList.add("open");

    });


  document
    .getElementById(
      "close-checkout-modal"
    )
    ?.addEventListener("click", () => {

      checkoutModal?.classList.remove("open");

    });


  document
    .getElementById("checkout-form")
    ?.addEventListener(
      "submit",
      (e) => {

        e.preventDefault();


        alert(
          "Thank you! Your order has been placed successfully."
        );


        cart = [];


        saveCart();

        updateCartUI();


        checkoutModal?.classList.remove(
          "open"
        );

      }
    );

});


// =========================
// SCROLL REVEAL
// =========================

function initScrollReveal() {

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1
  };


  const observer =
    new IntersectionObserver(
      (entries) => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add(
              "active"
            );

          }

        });

      },
      observerOptions
    );


  document
    .querySelectorAll(
      ".featured-section, .footer, .filter-bar, .section-header, .product-card"
    )
    .forEach(el => {

      if (
        !el.classList.contains("reveal")
      ) {

        el.classList.add("reveal");

        observer.observe(el);

      }

    });

}
  // =========================
  // SCROLL TO TOP
  // =========================

  const scrollToTopBtn =
    document.getElementById("scroll-to-top");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollToTopBtn?.classList.add("show");
    } else {
      scrollToTopBtn?.classList.remove("show");
    }
  });

  scrollToTopBtn?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  async function testSupabaseConnection() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*");

  console.log("Supabase products:", data);
  console.log("Supabase error:", error);
}

loadProductsFromSupabase();
