// ========================================
// URBAN SOLE - MAIN JAVASCRIPT
// ========================================


// ========================================
// PRODUCTS
// ========================================

import { auth } from "../auth/firebase-config.js";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
  // ========================================
// GET LOGGED-IN CUSTOMER PROFILE
// ========================================

async function getCustomerProfile() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in before checkout.");
  }

  await user.reload();

  if (!user.emailVerified) {
    throw new Error("Please verify your email before checkout.");
  }

  const token = await user.getIdToken(true);

  const response = await fetch(
    "https://jdqlviwvvpflsvrgpxel.supabase.co/functions/v1/customer-profile",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        action: "get"
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "Unable to load your customer profile."
    );
  }

  if (!result.profile) {
    throw new Error(
      "Customer profile not found. Please complete your profile."
    );
  }

  return result.profile;
}
let shoesData = [];

let cart =
  JSON.parse(localStorage.getItem("urbanSoleCart")) || [];

let currentFilter = "all";
let currentSearch = "";

let showAllProducts = false;
const FEATURED_PRODUCT_LIMIT = 8;

let activeModalShoe = null;


// ========================================
// LOAD PRODUCTS FROM SUPABASE
// ========================================

async function loadProductsFromSupabase() {
  const previousProducts = JSON.stringify(shoesData);

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

    price:
      `₦${Number(product.price).toLocaleString()}`,

    badge: product.tag || "",

    badgeClass:
      product.tag === "New"
        ? "badge-dark"
        : product.tag === "Sale"
        ? "badge-red"
        : product.tag === "Popular"
        ? "badge-yellow"
        : "",

    image:
      Array.isArray(product.photos) &&
      product.photos.length > 0
        ? product.photos[0]
        : "https://placehold.co/600x600",

    brand: product.brand,

    category: product.category,

    size: product.size,

    condition: product.condition,

    description: product.description,

    stockQuantity: Number(product.quantity) || 0,

    status: product.status
  }));

  // Only update the storefront when product data changes
const productsChanged =
  previousProducts !== JSON.stringify(shoesData);

if (productsChanged) {
  validateCartStock();
  renderShoes();
  updateCartUI();
}
}

function validateCartStock() {

  let cartChanged = false;

  cart = cart.filter(cartItem => {

    const product = shoesData.find(
      shoe => shoe.id === cartItem.id
    );

    // Product no longer exists
    if (!product) {
      cartChanged = true;
      return false;
    }

    // Product is sold out
    if (
      product.stockQuantity <= 0 ||
      product.status?.toLowerCase() === "sold"
    ) {
      cartChanged = true;
      return false;
    }

    // Customer has more in cart than currently available
    if (cartItem.quantity > product.stockQuantity) {

      cartItem.quantity = product.stockQuantity;

      cartChanged = true;
    }

    // Update cart with latest product information
    cartItem.name = product.name;
    cartItem.rawPrice = product.rawPrice;
    cartItem.price = product.price;
    cartItem.image = product.image;
    cartItem.size = product.size;
    cartItem.stockQuantity = product.stockQuantity;
    cartItem.status = product.status;

    return true;
  });


  if (cartChanged) {

    localStorage.setItem(
      "urbanSoleCart",
      JSON.stringify(cart)
    );

  }
}


// ========================================
// CART STORAGE
// ========================================

function saveCart() {

  localStorage.setItem(
    "urbanSoleCart",
    JSON.stringify(cart)
  );

}


// ========================================
// PRODUCT RENDERING
// ========================================

function renderShoes() {

  const gridContainer =
    document.getElementById("product-grid");

  const countSpan =
    document.getElementById("total-count");

  if (!gridContainer) return;


 const filteredShoes = shoesData.filter(shoe => {
  // Hide sold-out products
  const isAvailable =
    shoe.stockQuantity > 0 &&
    shoe.status?.toLowerCase() !== "sold";

  const matchesFilter =
    currentFilter === "all" ||
    shoe.badge === currentFilter;

  const matchesSearch =
    shoe.name
      .toLowerCase()
      .includes(currentSearch.toLowerCase());

  return isAvailable && matchesFilter && matchesSearch;
  });

  if (countSpan) {
    countSpan.textContent = filteredShoes.length;
  }


  if (filteredShoes.length === 0) {

    gridContainer.innerHTML = `
      <p
        style="
          grid-column: 1/-1;
          text-align: center;
          color: #777;
          padding: 40px 0;
        "
      >
        No sneakers match your search.
      </p>
    `;

    return;
  }


  

const visibleShoes = showAllProducts
  ? filteredShoes
  : filteredShoes.slice(0, FEATURED_PRODUCT_LIMIT);

const viewAllBtn = document.getElementById("view-all-products-btn");

if (viewAllBtn) {
  viewAllBtn.hidden = showAllProducts ||
    filteredShoes.length <= FEATURED_PRODUCT_LIMIT;
}

gridContainer.innerHTML = visibleShoes

  .map(shoe => `
    <div class="product-card"
         onclick="openProductModal(${shoe.id})">

      <div class="card-image-wrapper">
        ${shoe.badge ? `
          <span class="badge ${shoe.badgeClass}">
            ${shoe.badge === "Popular" ? "♛ " : ""}${shoe.badge}
          </span>
        ` : ""}

        <img
          src="${shoe.image}"
          alt="${shoe.name}"
          loading="lazy"
        >
      </div>

      <div class="card-info">
        <h3 class="product-name">${shoe.name}</h3>

        <p class="product-brand">
          ${shoe.brand || "Premium Footwear"}
        </p>

        <div class="product-card-bottom">
          <strong class="product-card-price">
            ${shoe.price}
          </strong>

          <button
            type="button"
            class="add-to-cart-btn"
            aria-label="Add ${shoe.name} to cart"
            onclick="event.stopPropagation(); addToCart(${shoe.id})"
          >
            🛒
          </button>
        </div>
      </div>
    </div>
  `)
  .join("");



  initScrollReveal();
}


// ========================================
// PRODUCT MODAL
// ========================================

function openProductModal(shoeId) {

  const shoe =
    shoesData.find(item => item.id === shoeId);

  if (!shoe) return;

  activeModalShoe = shoe;


  const image =
    document.getElementById("modal-product-img");

  const title =
    document.getElementById("modal-product-title");

  const price =
    document.getElementById("modal-product-price");

  const badge =
    document.getElementById("modal-product-badge");


  if (image) {
    image.src = shoe.image;
    image.alt = shoe.name;
  }

  if (title) {
    title.textContent = shoe.name;
  }

  if (price) {
    price.textContent = shoe.price;
  }

  if (badge) {
    badge.textContent = shoe.badge;
    badge.className =
      `badge ${shoe.badgeClass}`;
  }


  document
    .getElementById("product-modal-overlay")
    ?.classList.add("open");
}


function closeProductModal() {

  document
    .getElementById("product-modal-overlay")
    ?.classList.remove("open");

}


// ========================================
// ADD TO CART
// ========================================

function addToCart(shoeId) {

  const shoe =
    shoesData.find(item => item.id === shoeId);

  if (!shoe) return;


  // Check if product is sold out
  if (
    shoe.stockQuantity <= 0 ||
    shoe.status?.toLowerCase() === "sold"
  ) {

    showToast(`${shoe.name} is sold out.`);

    return;
  }


  const existingIndex =
    cart.findIndex(item => item.id === shoeId);


  // Product already exists in cart
  if (existingIndex > -1) {

    const currentCartQuantity =
      Number(cart[existingIndex].quantity) || 0;


    // Don't allow more than available stock
    if (
      currentCartQuantity >= shoe.stockQuantity
    ) {

      showToast(
        `Only ${shoe.stockQuantity} pair(s) available.`
      );

      return;
    }


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

  showToast(
    `Added ${shoe.name} to cart!`
  );
}


// ========================================
// TOAST NOTIFICATION
// ========================================

function showToast(message) {

  const existingToast =
    document.getElementById(
      "toast-notification"
    );

  if (existingToast) {
    existingToast.remove();
  }


  const toast =
    document.createElement("div");

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


// ========================================
// CHANGE CART QUANTITY
// ========================================

function changeQuantity(index, amount) {

  if (!cart[index]) return;


  const item = cart[index];

  const newQuantity =
    Number(item.quantity) + amount;


  // Remove item if quantity reaches 0
  if (newQuantity <= 0) {

    cart.splice(index, 1);

    saveCart();

    updateCartUI();

    return;
  }


  // Find latest product information
  const product =
    shoesData.find(
      shoe => shoe.id === item.id
    );


  // Check available stock
  if (
    product &&
    newQuantity > product.stockQuantity
  ) {

    showToast(
      `Only ${product.stockQuantity} pair(s) available.`
    );

    return;
  }


  item.quantity = newQuantity;

  saveCart();

  updateCartUI();
}


// ========================================
// REMOVE FROM CART
// ========================================

function removeFromCart(index) {

  if (!cart[index]) return;

  cart.splice(index, 1);

  saveCart();

  updateCartUI();
}


// ========================================
// UPDATE CART UI
// ========================================

function updateCartUI() {

  const cartBadge =
    document.getElementById("cart-badge");

  const drawerCount =
    document.getElementById(
      "cart-drawer-count"
    );

  const cartItemsContainer =
    document.getElementById("cart-items");

  const cartSubtotal =
    document.getElementById(
      "cart-subtotal-price"
    );


  if (!cartItemsContainer) return;


  // Total quantity of all products
  const totalQuantity =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );


  if (cartBadge) {
    cartBadge.textContent = totalQuantity;
  }


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

      cartSubtotal.textContent = "₦0";

    }

    return;
  }


  let total = 0;


  cartItemsContainer.innerHTML =
    cart
      .map((item, index) => {

        const price =
          Number(item.rawPrice) || 0;

        const quantity =
          Number(item.quantity) || 1;

        const itemTotal =
          price * quantity;

        total += itemTotal;


        return `

          <div class="cart-item-row">

            <div class="cart-item-info">

              <h4>
                ${item.name}
              </h4>

              <p>
                ₦${price.toLocaleString()} each
              </p>


              <div
                class="cart-quantity-controls"
              >

                <button
                  class="quantity-btn"
                  onclick="
                    changeQuantity(${index}, -1)
                  "
                  aria-label="Decrease quantity"
                >
                  −
                </button>


                <span class="cart-quantity">
                  ${quantity}
                </span>


                <button
                  class="quantity-btn"
                  onclick="
                    changeQuantity(${index}, 1)
                  "
                  aria-label="Increase quantity"
                >
                  +
                </button>

              </div>

            </div>


            <div class="cart-item-actions">

              <strong class="cart-item-total">
                ₦${itemTotal.toLocaleString()}
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


  if (cartSubtotal) {

    cartSubtotal.textContent =
      `₦${total.toLocaleString()}`;

  }
}


// ========================================
// CART DRAWER
// ========================================

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


// ========================================
// SCROLL REVEAL
// ========================================

function initScrollReveal() {

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1
  };


  const observer =
    new IntersectionObserver(
      entries => {

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


// ========================================
// DOM CONTENT LOADED
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {


    // ====================================
    // LOAD SUPABASE PRODUCTS
    // ====================================

    await loadProductsFromSupabase();


    // ====================================
    // LOAD CART
    // ====================================

    updateCartUI();


    // ====================================
    // ANIMATIONS
    // ====================================

    initScrollReveal();


    // View All Products
    const viewAllProductsBtn =
      document.getElementById("view-all-products-btn");

    viewAllProductsBtn?.addEventListener("click", () => {
      showAllProducts = true;
      renderShoes();
    });

    // ====================================
    // SEARCH
    // ====================================

    const searchToggleBtn =
      document.getElementById(
        "search-toggle-btn"
      );

    const searchInput =
      document.getElementById(
        "search-input"
      );


    searchInput?.addEventListener(
      "input",
      event => {

        currentSearch =
          event.target.value;

        renderShoes();

      }
    );


    searchToggleBtn?.addEventListener(
  "click",
  async () => {

        searchInput?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        searchInput?.focus();

      }
    );


    // ====================================
    // NAVBAR
    // ====================================

    const navLinks =
      document.querySelectorAll(
        ".nav-link"
      );


    // SHOP
    const shopLink = navLinks[1];


    shopLink?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        currentSearch = "";

        if (searchInput) {
          searchInput.value = "";
        }

        currentFilter = "all";


        const pillBtns =
          document.querySelectorAll(
            ".pill-btn"
          );


        pillBtns.forEach(btn => {

          btn.classList.remove("active");

        });


        document
          .querySelector(
            '.pill-btn[data-filter="all"]'
          )
          ?.classList.add("active");


        renderShoes();


        document
          .getElementById("featured")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

      }
    );


    // ====================================
    // NEW ARRIVALS
    // ====================================

    const newArrivalsLink =
      navLinks[2];


    newArrivalsLink?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        currentSearch = "";

        if (searchInput) {
          searchInput.value = "";
        }


        currentFilter = "New";


        const pillBtns =
          document.querySelectorAll(
            ".pill-btn"
          );


        pillBtns.forEach(btn => {

          btn.classList.remove("active");

        });


        document
          .querySelector(
            '.pill-btn[data-filter="New"]'
          )
          ?.classList.add("active");


        renderShoes();


        document
          .getElementById("featured")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

      }
    );


    // ====================================
    // FILTER BUTTONS
    // ====================================

    const pillBtns =
      document.querySelectorAll(
        ".pill-btn"
      );


    pillBtns.forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          pillBtns.forEach(button => {

            button.classList.remove(
              "active"
            );

          });


          btn.classList.add("active");

          currentFilter =
            btn.dataset.filter;

          renderShoes();

        }
      );

    });


    // ====================================
    // PRODUCT MODAL
    // ====================================

    document
      .getElementById("modal-add-btn")
      ?.addEventListener(
        "click",
        () => {

          if (activeModalShoe) {

            addToCart(
              activeModalShoe.id
            );

            closeProductModal();

          }

        }
      );


    document
      .getElementById(
        "close-product-modal"
      )
      ?.addEventListener(
        "click",
        closeProductModal
      );


    document
      .getElementById(
        "product-modal-overlay"
      )
      ?.addEventListener(
        "click",
        event => {

          if (
            event.target.id ===
            "product-modal-overlay"
          ) {

            closeProductModal();

          }

        }
      );


    // ====================================
    // CART
    // ====================================

    document
      .getElementById("cart-btn")
      ?.addEventListener(
        "click",
        () => {

          toggleCart(true);

        }
      );


    document
      .getElementById(
        "close-cart-btn"
      )
      ?.addEventListener(
        "click",
        () => {

          toggleCart(false);

        }
      );


    document
      .getElementById(
        "cart-overlay"
      )
      ?.addEventListener(
        "click",
        () => {

          toggleCart(false);

        }
      );


    // ====================================
    // CHECKOUT MODAL
    // ====================================

    const checkoutModal =
      document.getElementById(
        "checkout-modal-overlay"
      );


    document
      .getElementById(
        "open-checkout-btn"
      )
      ?.addEventListener(
        "click",
       async () => {

          if (cart.length === 0) {

            alert(
              "Your cart is empty!"
            );

            return;
          }


          // Calculate checkout total
          const total =
            cart.reduce(
              (sum, item) => {

                const price =
                  Number(
                    item.rawPrice
                  ) || 0;

                const quantity =
                  Number(
                    item.quantity
                  ) || 1;

                return (
                  sum +
                  price * quantity
                );

              },
              0
            );


          const checkoutTotal =
            document.getElementById(
              "checkout-total-price"
            );


          if (checkoutTotal) {

            checkoutTotal.textContent =
              `₦${total.toLocaleString()}`;

          }


         try {
  const profile = await getCustomerProfile();

  document.getElementById("customer-name").value =
    profile.full_name;

  document.getElementById("customer-phone").value =
    profile.whatsapp_number;

  document.getElementById("customer-address").value =
    profile.delivery_address;
    document.getElementById("customer-name").readOnly = true;
  document.getElementById("customer-phone").readOnly = true;
  document.getElementById("customer-address").readOnly = true;

  toggleCart(false);
  checkoutModal?.classList.add("open");

} catch (error) {
  console.error("Checkout profile error:", error);

  alert(error.message);

    if (error.message.includes("log in")) {
    window.location.href = "pages/login.html";
  }
}

    }
  );



    // ====================================
    // CLOSE CHECKOUT
    // ====================================

    document
      .getElementById(
        "close-checkout-modal"
      )
      ?.addEventListener(
        "click",
        () => {

          checkoutModal?.classList.remove(
            "open"
          );

        }
      );


    // Close checkout by clicking background
    checkoutModal?.addEventListener(
      "click",
      event => {

        if (
          event.target === checkoutModal
        ) {

          checkoutModal.classList.remove(
            "open"
          );

        }

      }
    );


    // ====================================
    // WHATSAPP CHECKOUT
    // ====================================
    let isCheckoutProcessing = false;
    const CHECKOUT_KEY_STORAGE = "urbanSoleCheckoutKey";

    function getCheckoutKey() {
      let key = localStorage.getItem(CHECKOUT_KEY_STORAGE);

      if (!key) {
        key = crypto.randomUUID();
        localStorage.setItem(CHECKOUT_KEY_STORAGE, key);
      }

      return key;
    }
    document
    .getElementById("checkout-form")
    ?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (isCheckoutProcessing) {
      return;
    }

    isCheckoutProcessing = true;
    

    let profile;

try {
  profile = await getCustomerProfile();
} catch (error) {
  console.error("Checkout profile error:", error);
  alert(error.message);
  isCheckoutProcessing = false;
  return;
}

const customerEmail = profile.email;

          // Customer details
          const customerName =
            document
              .getElementById(
                "customer-name"
              )
              ?.value
              .trim();


          const customerPhone =
            document
              .getElementById(
                "customer-phone"
              )
              ?.value
              .trim();


          const customerAddress =
            document
              .getElementById(
                "customer-address"
              )
              ?.value
              .trim();


          // Safety check
          if (
            !customerName ||
            !customerPhone ||
            !customerAddress
          ) {
            alert("Please complete all your details.");
            isCheckoutProcessing = false;
            return;
          }

          if (cart.length === 0) {
            alert("Your cart is empty.");

            isCheckoutProcessing = false;

            return;
          }

            // =================================
// CALCULATE ORDER TOTAL
// =================================

let orderTotal = 0;

cart.forEach(item => {

  const quantity =
    Number(item.quantity) || 1;

  const price =
    Number(item.rawPrice) || 0;

  orderTotal += price * quantity;

});


// =================================
// PREPARE ORDER ITEMS
// =================================
let verifiedItems = [];
let verifiedTotal = 0;
const orderItems = cart.map(item => ({

  product_id: item.id,

  name: item.name,

  size: item.size || "Not specified",

  quantity:
    Number(item.quantity) || 1,

  price:
    Number(item.rawPrice) || 0

}));


// =================================
// SAVE ORDER TO SUPABASE
// =================================


const user = auth.currentUser;

if (!user) {
  alert("Please log in before placing an order.");

  isCheckoutProcessing = false;

  return;
}

try {
  const token = await user.getIdToken(true);
  const checkoutKey = getCheckoutKey();

  const response = await fetch(
    "https://jdqlviwvvpflsvrgpxel.supabase.co/functions/v1/customer-profile",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        action: "create_order",
        idempotency_key: checkoutKey,
        items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Unable to create order.");
  }

  // Use the server-verified prices and quantities
  const savedOrder = result.order;
  verifiedItems = savedOrder.items;
  verifiedTotal = Number(savedOrder.total);

  console.log("Order created successfully:", savedOrder.id);

  // Continue to WhatsApp message creation below
} catch (error) {
  console.error("Secure checkout error:", error);
  alert(error.message);

  isCheckoutProcessing = false;

  return;
}



console.log(
  "Order created successfully."
);
try {
          // =================================
          // BUILD WHATSAPP MESSAGE
          // =================================

          let message =
`Hello Urban Sole 👋

I'd like to place an order.

*ORDER DETAILS*
`;


          let total = 0;

          verifiedItems.forEach(
            (item, index) => {

              const quantity =
                Number(
                  item.quantity
                ) || 1;


              const price =
  Number(item.price) || 0;


              const subtotal =
                price * quantity;


              total += subtotal;


              message +=
`
${index + 1}. *${item.name}*
Size: ${item.size || "Not specified"}
Quantity: ${quantity}
Price: ₦${price.toLocaleString()}
Subtotal: ₦${subtotal.toLocaleString()}
`;

            }
          );


          // =================================
          // CUSTOMER INFORMATION
          // =================================

          message +=
`

-------------------------
*TOTAL: ₦${verifiedTotal.toLocaleString()}*
-------------------------

*CUSTOMER DETAILS*

Name: ${profile.full_name}
Email: ${customerEmail}
Phone: ${profile.whatsapp_number}
Delivery Address: ${profile.delivery_address}

I'd like to proceed with this order.
Please send me the payment details.
`;


          // =================================
          // URBAN SOLE WHATSAPP NUMBER
          // =================================

          const whatsappNumber =
            "2347015058379";


          // =================================
          // CREATE WHATSAPP LINK
          // =================================

          const whatsappURL =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


          // =================================
          // OPEN WHATSAPP
          // =================================

          const whatsappWindow = window.open(
          whatsappURL,
          "_blank"
        );

        if (!whatsappWindow) {
        alert(
          "Your order was saved, but WhatsApp was blocked. We will open WhatsApp in this tab instead."
        );

        cart = [];
        localStorage.removeItem("urbanSoleCart");
        updateCartUI();

        checkoutModal?.classList.remove("open");

        window.location.href = whatsappURL;
        return;
              }
          // Clear cart after successful order creation
          cart = [];

          localStorage.removeItem("urbanSoleCart");

          updateCartUI();
          localStorage.removeItem(CHECKOUT_KEY_STORAGE);

          isCheckoutProcessing = false;


          // Close checkout modal
          checkoutModal?.classList.remove(
            "open"
          );
              } catch (error) {
            console.error("WhatsApp checkout error:", error);
            alert("Unable to complete checkout: " + error.message);
          } finally {
          }


          /*
            IMPORTANT:
            We intentionally DO NOT clear
            the cart here.

            Opening WhatsApp does not mean
            the customer has paid.
          */

        }
      );


    // ====================================
    // SCROLL TO TOP
    // ====================================

    const scrollToTopBtn =
      document.getElementById(
        "scroll-to-top"
      );


    window.addEventListener(
      "scroll",
      () => {

        if (window.scrollY > 400) {

          scrollToTopBtn?.classList.add(
            "show"
          );

        } else {

          scrollToTopBtn?.classList.remove(
            "show"
          );

        }

      }
    );


    scrollToTopBtn?.addEventListener(
      "click",
      () => {

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }
    );

  }
);

// ===================================
// MOBILE NAVIGATION MENU
// ===================================

const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("active");

    mobileMenuBtn.textContent = isOpen ? "✕" : "☰";
    mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
    mobileMenuBtn.setAttribute(
      "aria-label",
      isOpen ? "Close menu" : "Open menu"
    );
  });

  // Close menu when a navigation link is clicked
  document.querySelectorAll(".mobile-nav-link").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      mobileMenuBtn.textContent = "☰";
      mobileMenuBtn.setAttribute("aria-expanded", "false");
      mobileMenuBtn.setAttribute("aria-label", "Open menu");
    });
  });
}
// ========================================
// EXPOSE FUNCTIONS TO HTML BUTTONS
// ========================================

window.openProductModal = openProductModal;
window.addToCart = addToCart;
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;
// ========================================
// CUSTOMER PAYMENT WALLET
// ========================================

function getWalletReadKey(userId) {
  return `urbanSoleWalletRead_${userId}`;
}

function getReadWalletUpdates(userId) {
  try {
    return JSON.parse(
      localStorage.getItem(getWalletReadKey(userId)) || "[]"
    );
  } catch {
    return [];
  }
}

function getWalletUpdateId(order) {
  const paymentStatus = String(
    order.payment_status || "pending"
  ).toLowerCase();

  const orderStatus = String(
    order.order_status || "pending"
  ).toLowerCase();

  const items = JSON.stringify(order.items || []);
  const total = Number(order.total || 0);

  return `${order.id}:${paymentStatus}:${orderStatus}:${items}:${total}`;
}

function getUnreadWalletUpdates(orders, userId) {
  const readUpdates = new Set(
    getReadWalletUpdates(userId)
  );

  return orders.filter(
    order => !readUpdates.has(getWalletUpdateId(order))
  );
}

function markWalletUpdatesAsRead(orders, userId) {
  const readUpdates = new Set(
    getReadWalletUpdates(userId)
  );

  orders.forEach(order => {
    readUpdates.add(getWalletUpdateId(order));
  });

  localStorage.setItem(
    getWalletReadKey(userId),
    JSON.stringify([...readUpdates])
  );
}

const walletBtn = document.getElementById("wallet-btn");
const walletDrawer = document.getElementById("wallet-drawer");
const walletOverlay = document.getElementById("wallet-overlay");
const closeWalletBtn = document.getElementById("close-wallet-btn");

function closePaymentWallet() {
  walletDrawer.classList.remove("open");
  walletOverlay.classList.remove("active");
}

walletBtn?.addEventListener("click", async () => {
  walletDrawer.classList.add("open");
  walletOverlay.classList.add("active");

  const walletOrders = document.getElementById("wallet-orders");
  walletOrders.textContent = "Loading your payments...";

  try {
    await auth.authStateReady();

    const user = auth.currentUser;

    if (!user) {
      walletOrders.textContent = "Please log in to view your payments.";
      return;
    }

    const token = await user.getIdToken(true);

    const response = await fetch(
      "https://jdqlviwvvpflsvrgpxel.supabase.co/functions/v1/customer-profile",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: "get_orders" })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to load payments.");
    }

    const orders = result.orders || [];

    walletOrders.textContent = "";

    if (orders.length === 0) {
      walletOrders.textContent = "You have no orders yet.";
      return;
    }

    orders.forEach((order) => {
  const item = document.createElement("div");
  item.className = "wallet-order-item";

  const title = document.createElement("h4");
  title.textContent = `Order #${order.id}`;

  const paymentStatus = String(
    order.payment_status || "pending"
  ).toLowerCase();

  const orderStatus = String(
    order.order_status || "pending"
  ).toLowerCase();

  const isCancelled =
    orderStatus === "cancelled" ||
    paymentStatus === "cancelled";

  // Show original shoes for cancelled orders.
  // Otherwise, show the current order items.
  const displayItems = isCancelled
    ? (order.original_items || order.items || [])
    : (order.items || []);

  const shoes = document.createElement("p");

  shoes.textContent = displayItems.length
    ? displayItems.map((shoe) =>
        `${shoe.name} (Size ${shoe.size || "N/A"}) × ${shoe.quantity}`
      ).join(", ")
    : "No shoe details available";
  // Notify customer when shoes are removed from an order
const originalItems = Array.isArray(order.original_items)
  ? order.original_items
  : [];

const currentItems = Array.isArray(order.items)
  ? order.items
  : [];

const removedShoes = originalItems.filter(originalShoe => {
  return !currentItems.some(currentShoe =>
    String(currentShoe.product_id) ===
    String(originalShoe.product_id)
  );
});

if (removedShoes.length > 0) {
  const notification = document.createElement("p");

  const shoeNames = removedShoes
    .map(shoe => shoe.name)
    .join(", ");

  notification.textContent = isCancelled
    ? `${shoeNames} was purchased by another customer. Your order has been cancelled.`
    : `${shoeNames} was purchased by another customer and removed from your order. Your remaining order total has been updated.`;

  notification.style.color = "#dc2626";
  notification.style.fontWeight = "500";
  notification.style.marginTop = "8px";

  item.appendChild(notification);
}
  const amount = document.createElement("p");

  amount.textContent = `Total: ₦${Number(
    order.total || 0
  ).toLocaleString("en-NG")}`;

  const status = document.createElement("p");

  if (isCancelled) {
    status.textContent = "Order Cancelled ✕";
    status.style.color = "#dc2626";
  } else if (paymentStatus === "paid") {
    status.textContent = "Payment Confirmed ✓";
    status.style.color = "#16a34a";
  } else {
    status.textContent = "Pending Payment";
    status.style.color = "#d97706";
  }

 // Order header
  const orderHeader = document.createElement("div");
  orderHeader.className = "wallet-order-header";
  orderHeader.append(title, status);

  // Shoe details
 const shoeDetails = document.createElement("div");
  shoeDetails.className = "wallet-shoe-details";

  const shoeIcon = document.createElement("div");
  shoeIcon.className = "wallet-shoe-icon";
  shoeIcon.textContent = "👟";

  const shoeInfo = document.createElement("div");
  shoeInfo.className = "wallet-shoe-info";
  shoeInfo.append(shoes, amount);

  shoeDetails.append(shoeIcon, shoeInfo);

  // Put the order information into the card
  item.prepend(orderHeader, shoeDetails);
  walletOrders.appendChild(item);
});

    // Mark displayed order updates as read
markWalletUpdatesAsRead(orders, user.uid);

// Clear the notification badge
const walletBadge = document.getElementById("wallet-badge");

if (walletBadge) {
  walletBadge.textContent = "0";
  walletBadge.hidden = true;
}

  } catch (error) {
    console.error("Wallet error:", error);
    walletOrders.textContent = error.message;
  }
});

closeWalletBtn?.addEventListener("click", closePaymentWallet);
// ========================================
// AUTOMATIC WALLET NOTIFICATIONS
// ========================================

async function checkWalletNotifications() {
  try {
    await auth.authStateReady();

    const user = auth.currentUser;
    const walletBadge = document.getElementById("wallet-badge");

    if (!walletBadge) return;

    if (!user) {
      walletBadge.hidden = true;
      return;
    }

    const token = await user.getIdToken();

    const response = await fetch(
      "https://jdqlviwvvpflsvrgpxel.supabase.co/functions/v1/customer-profile",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "get_orders"
        })
      }
    );

    if (!response.ok) {
      throw new Error("Unable to check wallet notifications.");
    }

    const result = await response.json();
    const orders = result.orders || [];

    // Do not show unread notifications while wallet is open
    if (walletDrawer?.classList.contains("open")) {
      return;
    }

    const unreadOrders = getUnreadWalletUpdates(
      orders,
      user.uid
    );

    walletBadge.textContent = String(unreadOrders.length);
    walletBadge.hidden = unreadOrders.length === 0;

  } catch (error) {
    console.error("Wallet notification error:", error);
  }
}

// Check when the customer logs in or logs out
onAuthStateChanged(auth, () => {
  checkWalletNotifications();
});

// Check when the customer returns to the website
window.addEventListener("focus", checkWalletNotifications);

// Check every 30 seconds while the website is open
setInterval(checkWalletNotifications, 30000);
// ========================================
// AUTOMATIC INVENTORY AND CART UPDATES
// ========================================

// Check stock every 10 seconds while the page is open
setInterval(async () => {
  if (document.visibilityState === "visible") {
    await loadProductsFromSupabase();
  }
}, 10000);

// Refresh stock when the customer returns to the tab
window.addEventListener("focus", async () => {
  await loadProductsFromSupabase();
});
walletOverlay?.addEventListener("click", closePaymentWallet);