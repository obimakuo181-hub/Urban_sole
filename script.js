// ========================================
// URBAN SOLE - MAIN JAVASCRIPT
// ========================================


// ========================================
// PRODUCTS
// ========================================

let shoesData = [];

let cart =
  JSON.parse(localStorage.getItem("urbanSoleCart")) || [];

let currentFilter = "all";
let currentSearch = "";
let activeModalShoe = null;


// ========================================
// LOAD PRODUCTS FROM SUPABASE
// ========================================

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

    price:
      `₦${Number(product.price).toLocaleString()}`,

    badge:
      product.status?.toLowerCase() === "available"
        ? "New"
        : "",

    badgeClass:
      product.status?.toLowerCase() === "available"
        ? "badge-dark"
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

  validateCartStock();

  renderShoes();

  updateCartUI();
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

    const matchesFilter =
      currentFilter === "all" ||
      shoe.badge === currentFilter;

    const matchesSearch =
      shoe.name
        .toLowerCase()
        .includes(currentSearch.toLowerCase());

    return matchesFilter && matchesSearch;

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


  gridContainer.innerHTML =
    filteredShoes
      .map(shoe => `

        <div
          class="product-card"
          onclick="openProductModal(${shoe.id})"
        >

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
              class="add-to-cart-btn ${shoe.stockQuantity <= 0 || shoe.status?.toLowerCase() === "sold" ? "sold-out-btn" : ""}"
              onclick="
                event.stopPropagation();
                addToCart(${shoe.id})
              "
              ${shoe.stockQuantity <= 0 || shoe.status?.toLowerCase() === "sold" ? "disabled" : ""}
            >
              ${
                shoe.stockQuantity <= 0 ||
                shoe.status?.toLowerCase() === "sold"
                  ? "SOLD OUT"
                  : "Add to Cart"
              }
            </button>

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
      () => {

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
        () => {

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


          toggleCart(false);

          checkoutModal?.classList.add(
            "open"
          );

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

    document
      .getElementById(
        "checkout-form"
      )
     ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


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

            alert(
              "Please complete all your details."
            );

            return;
          }


          if (cart.length === 0) {

            alert(
              "Your cart is empty."
            );

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

const { error: orderError } =
  await supabaseClient
    .from("orders")
    .insert({

      customer_name:
        customerName,

      customer_phone:
        customerPhone,

      delivery_address:
        customerAddress,

      items:
        orderItems,

      total:
        orderTotal,

      payment_status:
        "pending",

      order_status:
        "pending"

    });


// =================================
// CHECK IF ORDER SAVED
// =================================

if (orderError) {

  console.error(
    "Error saving order:",
    orderError
  );

  alert(
    "We could not create your order. Please try again."
  );

  return;
}


console.log(
  "Order created successfully."
);
          // =================================
          // BUILD WHATSAPP MESSAGE
          // =================================

          let message =
`Hello Urban Sole 👋

I'd like to place an order.

*ORDER DETAILS*
`;


          let total = 0;


          cart.forEach(
            (item, index) => {

              const quantity =
                Number(
                  item.quantity
                ) || 1;


              const price =
                Number(
                  item.rawPrice
                ) || 0;


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
*TOTAL: ₦${total.toLocaleString()}*
-------------------------

*CUSTOMER DETAILS*

Name: ${customerName}
Phone: ${customerPhone}
Delivery Address: ${customerAddress}

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

          window.open(
            whatsappURL,
            "_blank"
          );


          // Close checkout modal
          checkoutModal?.classList.remove(
            "open"
          );


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