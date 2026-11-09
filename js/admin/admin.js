// ================================
// ELEMENTS
// ================================

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");
const logoutBtn = document.getElementById("logout-btn");

const productForm = document.getElementById("product-form");
// ================================
// PRODUCT FORM DRAFT
// ================================

const PRODUCT_DRAFT_KEY = "urbanSoleProductDraft";

productForm.addEventListener("input", () => {
  // Don't save drafts while editing an existing product
  if (editingProductId !== null) return;

  const draft = {};

  productForm
    .querySelectorAll("input, select, textarea")
    .forEach((field) => {
      if (!field.id || field.type === "file") return;

      draft[field.id] = field.value;
    });

  localStorage.setItem(
    PRODUCT_DRAFT_KEY,
    JSON.stringify(draft)
  );
});
// ================================
// RESTORE PRODUCT FORM DRAFT
// ================================

function restoreProductDraft() {
  const savedDraft = localStorage.getItem(PRODUCT_DRAFT_KEY);

  if (!savedDraft) return;

  try {
    const draft = JSON.parse(savedDraft);

    productForm
      .querySelectorAll("input, select, textarea")
      .forEach((field) => {
        if (!field.id || field.type === "file") return;

        if (Object.prototype.hasOwnProperty.call(draft, field.id)) {
          field.value = draft[field.id];
        }
      });

  } catch (error) {
    console.error("Could not restore product draft:", error);
  }
}

// Restore draft when the page loads
restoreProductDraft();
const productMessage = document.getElementById("product-message");
const inventoryList = document.getElementById("inventory-list");
const ordersList = document.getElementById("orders-list");
const orderFilterButtons =
  document.querySelectorAll(
    ".order-filter-btn"
  );

let currentOrderFilter = "all";
const orderSearchInput =
  document.getElementById(
    "order-search-input"
  );

let currentOrderSearch = "";
const totalOrdersStat =
  document.getElementById("total-orders-stat");

const pendingOrdersStat =
  document.getElementById("pending-orders-stat");

const paidOrdersStat =
  document.getElementById("paid-orders-stat");

const revenueStat =
  document.getElementById("revenue-stat");
let editingProductId = null;
// ================================
// CHECK EXISTING LOGIN SESSION
// ================================

async function checkAdminSession() {

  const { data, error } =
    await supabaseClient.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    return;
  }

  const session = data.session;

  if (session) {
    // User is already logged in
    loginSection.style.display = "none";
    adminSection.style.display = "block";

    await loadInventory();
    await loadOrders();

  } else {
    // User is not logged in
    loginSection.style.display = "block";
    adminSection.style.display = "none";
  }
}

checkAdminSession();

// ================================
// LISTEN FOR AUTH CHANGES
// ================================

supabaseClient.auth.onAuthStateChange((event, session) => {

  if (session) {
    loginSection.style.display = "none";
    adminSection.style.display = "block";
  } else {
    adminSection.style.display = "none";
    loginSection.style.display = "block";
  }

});


// ================================
// LOGIN
// ================================

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  loginMessage.textContent = "Logging in...";

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

  if (error) {
    console.error("Login error:", error);

    loginMessage.textContent =
      "Login failed. Check your email and password.";

    return;
  }

  console.log("Logged in:", data.user);

  loginSection.style.display = "none";
  adminSection.style.display = "block";

  // Load products AFTER successful login
  await loadInventory();
  await loadOrders();
});


// ================================
// LOGOUT
// ================================

logoutBtn.addEventListener("click", async () => {

  await supabaseClient.auth.signOut();

  adminSection.style.display = "none";
  loginSection.style.display = "block";

  loginMessage.textContent = "";
});


// ================================
// ADD / UPDATE PRODUCT
// ================================

productForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const isEditing = editingProductId !== null;

  productMessage.textContent =
    isEditing
      ? "Updating product..."
      : "Adding product...";
    const photoInput = document.getElementById("product-photo");
    const photoFile = photoInput.files[0];

    let photoUrl = null;
    // Upload photo if one was selected
if (photoFile) {

  productMessage.textContent = "Uploading photo...";

  const fileExtension = photoFile.name.split(".").pop();

  const fileName =
    `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("product-images")
    .upload(fileName, photoFile);

  if (uploadError) {
    console.error("Image upload error:", uploadError);
    productMessage.textContent = "Could not upload image.";
    return;
  }

  const { data: publicUrlData } = supabaseClient.storage
    .from("product-images")
    .getPublicUrl(fileName);

  photoUrl = publicUrlData.publicUrl;
}

  const productData = {

    name:
      document
        .getElementById("product-name")
        .value
        .trim(),

    brand:
      document
        .getElementById("product-brand")
        .value
        .trim(),

    category:
      document
        .getElementById("product-category")
        .value
        .trim(),

    size:
      document
        .getElementById("product-size")
        .value
        .trim(),

    condition:
      document
        .getElementById("product-condition")
        .value
        .trim(),

    price:
      Number(
        document.getElementById("product-price").value
      ),

    description:
      document
        .getElementById("product-description")
        .value
        .trim(),

    quantity:
      Number(
        document.getElementById("product-quantity").value
      ),

    status:
      document.getElementById("product-status").value,

    tag:
      document.getElementById("product-tag").value
  };
  if (photoUrl) {
  productData.photos = [photoUrl];
  }


  let error;


  // UPDATE EXISTING PRODUCT
  if (isEditing) {

    const result = await supabaseClient
      .from("products")
      .update(productData)
      .eq("id", editingProductId);

    error = result.error;

  }

  // ADD NEW PRODUCT
  else {

  

    const result = await supabaseClient
      .from("products")
      .insert([productData]);

    error = result.error;

  }


  if (error) {

    console.error("Product save error:", error);

    productMessage.textContent =
      "Could not save product.";

    return;
  }


  productMessage.textContent =
    isEditing
      ? "Product updated successfully!"
      : "Product added successfully!";


  // Reset form
  productForm.reset();
  // Clear saved draft after successfully adding a product
if (!isEditing) {
  localStorage.removeItem(PRODUCT_DRAFT_KEY);
}

  document.getElementById(
    "product-quantity"
  ).value = 1;


  // Exit edit mode
  editingProductId = null;


  productForm
    .querySelector('button[type="submit"]')
    .textContent = "Add Product";


  // Reload inventory
  await loadInventory();
});


// ================================
// LOAD INVENTORY
// ================================

async function loadInventory() {

  inventoryList.innerHTML =
    "<p>Loading inventory...</p>";


  const { data, error } =
    await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false
      });


  if (error) {

    console.error(
      "Error loading inventory:",
      error
    );

    inventoryList.innerHTML =
      "<p>Could not load inventory.</p>";

    return;
  }

  // ================================
// UPDATE DASHBOARD STATS
// ================================

const totalProducts = data.reduce(
  (total, product) => total + Math.max(0, Number(product.quantity) || 0),
  0
);

console.log(
  "INVENTORY CHECK:",
  data.map(product => ({
    name: product.name,
    quantity: product.quantity
  })),
  "TOTAL PAIRS:",
  totalProducts
);

const availableProducts = data
  .filter(product =>
    product.status?.toLowerCase() === "available"
  )
  .reduce(
    (total, product) =>
      total + Math.max(0, Number(product.quantity) || 0),
    0
  );
const { data: paidOrderData, error: paidOrderError } =
  await supabaseClient
    .from("orders")
    .select("items")
    .eq("payment_status", "paid");

const soldProducts = paidOrderError
  ? 0
  : (paidOrderData || []).reduce((total, order) => {
      const items = Array.isArray(order.items)
        ? order.items
        : [];

      return total + items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      );
    }, 0);

if (paidOrderError) {
  console.error("Error calculating sold pairs:", paidOrderError);
}
const lowStockProducts = data.filter(product => {
  const quantity = Number(product.quantity) || 0;

  return (
    quantity >= 1 &&
    quantity <= 15 &&
    product.status?.toLowerCase() === "available"
  );
}).length;


document.getElementById(
  "total-products-stat"
).textContent = totalProducts;

document.getElementById(
  "available-products-stat"
).textContent = availableProducts;

document.getElementById(
  "sold-products-stat"
).textContent = soldProducts;

document.getElementById(
  "low-stock-stat"
).textContent = lowStockProducts;


  if (data.length === 0) {

    inventoryList.innerHTML =
      "<p>No products yet.</p>";

    return;
  }


  inventoryList.innerHTML = "";


  data.forEach((product) => {

    const productCard =
      document.createElement("div");

          // Determine stock level
    const quantity = Number(product.quantity) || 0;
    const isSold = product.status?.toLowerCase() === "sold";

    let stockLabel = "";
    let stockClass = "";

    if (quantity <= 0 || isSold) {
      stockLabel = "Sold Out";
      stockClass = "stock-sold";
    } else if (quantity <= 15) {
      stockLabel = "Low Stock";
      stockClass = "stock-low";
    } else if (quantity <= 69) {
      stockLabel = "Medium Stock";
      stockClass = "stock-medium";
    } else {
      stockLabel = "High Stock";
      stockClass = "stock-high";
    }


    productCard.innerHTML = `

      <h3>${product.name}</h3>

      <p>
        Brand: ${product.brand}
      </p>

      <p>
        Category: ${product.category}
      </p>

      <p>
        Size: ${product.size}
      </p>

      <p>
        Condition: ${product.condition}
      </p>

      <p>
        Price:
        ₦${Number(product.price).toLocaleString()}
      </p>

      <p>
        Quantity: ${product.quantity}
      </p>

      <p>
        Stock Level:
        <span class="stock-badge ${stockClass}">
          ${stockLabel}
        </span>
      </p>

      <p>
        Status: ${product.status}
      </p>

      <p>
        Tag: ${product.tag || "No Tag"}
      </p>


      <button
        onclick="editProduct(${product.id})"
      >
        Edit
      </button>


      <button
        onclick="deleteProduct(${product.id})"
      >
        Delete
      </button>

      <hr>

    `;


    inventoryList.appendChild(
      productCard
    );
  });
}


// ================================
// EDIT PRODUCT
// ================================

async function editProduct(productId) {

  const { data, error } =
    await supabaseClient
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();


  if (error) {

    console.error(
      "Error loading product:",
      error
    );

    alert("Could not load product.");

    return;
  }


  // Remember which product we're editing
  editingProductId = productId;


  // Fill form with existing information

  document.getElementById(
    "product-name"
  ).value = data.name || "";


  document.getElementById(
    "product-brand"
  ).value = data.brand || "";


  document.getElementById(
    "product-category"
  ).value = data.category || "";


  document.getElementById(
    "product-size"
  ).value = data.size || "";


  document.getElementById(
    "product-condition"
  ).value = data.condition || "";


  document.getElementById(
    "product-price"
  ).value = data.price || "";


  document.getElementById(
    "product-description"
  ).value = data.description || "";


  document.getElementById(
    "product-quantity"
  ).value = data.quantity ?? 1;


  document.getElementById(
    "product-status"
  ).value = data.status || "available";

  document.getElementById(
  "product-tag"
  ).value = data.tag || "";


  // Tell admin which product is being edited

  productMessage.textContent =
    `Editing: ${data.name}`;


  // Change button

  productForm
    .querySelector('button[type="submit"]')
    .textContent = "Save Changes";


  // Scroll to form

 // Scroll to form
// Open the Add Product page
adminPages.forEach(page => {
  page.classList.remove("active-page");
});

document.getElementById("product-form-section")
  .classList.add("active-page");

adminNavLinks.forEach(link => {
  link.classList.toggle(
    "active",
    link.getAttribute("href") === "#product-form-section"
  );
});

adminPageTitle.textContent = "Edit Product";

window.scrollTo({
  top: 0,
  behavior: "smooth"
});

} 

// ================================
// DELETE PRODUCT
// ================================

async function deleteProduct(productId) {

  const confirmed = confirm(
    "Are you sure you want to delete this product?"
  );


  if (!confirmed) return;


  const { error } =
    await supabaseClient
      .from("products")
      .delete()
      .eq("id", productId);


  if (error) {

    console.error(
      "Error deleting product:",
      error
    );

    alert("Could not delete product.");

    return;
  }


  await loadInventory();
}
// ================================
// LOAD ORDERS
// ================================

async function loadOrders() {

  if (!ordersList) return;

  ordersList.innerHTML =
    "<p>Loading orders...</p>";


  const { data, error } =
    await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false
      });


  if (error) {

    console.error(
      "Error loading orders:",
      error
    );

    ordersList.innerHTML =
      "<p>Could not load orders.</p>";

    return;
  }
  // ================================
// ORDER STATISTICS
// ================================

const totalOrders = data.length;


const pendingOrders =
  data.filter(order =>
    order.payment_status?.toLowerCase() === "pending"
  ).length;


const paidOrders =
  data.filter(order =>
    order.payment_status?.toLowerCase() === "paid"
  ).length;


const totalRevenue =
  data
    .filter(order =>
      order.payment_status?.toLowerCase() === "paid"
    )
    .reduce(
      (total, order) =>
        total + Number(order.total || 0),
      0
    );
    updateDashboardCharts(data);

if (totalOrdersStat) {
  totalOrdersStat.textContent =
    totalOrders;
}


if (pendingOrdersStat) {
  pendingOrdersStat.textContent =
    pendingOrders;
}


if (paidOrdersStat) {
  paidOrdersStat.textContent =
    paidOrders;
}


if (revenueStat) {
  revenueStat.textContent =
    `₦${totalRevenue.toLocaleString()}`;
}


 if (data.length === 0) {

  ordersList.innerHTML =
    "<p>No orders yet.</p>";

  return;
}


// ================================
// FILTER ORDERS
// ================================

let filteredOrders = data;


if (currentOrderFilter !== "all") {

  filteredOrders =
    data.filter(order =>

      order.payment_status
        ?.toLowerCase() ===
      currentOrderFilter

    );

}
// ================================
// SEARCH ORDERS
// ================================

if (currentOrderSearch) {

  filteredOrders =
    filteredOrders.filter(order => {

      const orderId =
        String(order.id);

      const customerName =
        String(
          order.customer_name || ""
        ).toLowerCase();

      const customerPhone =
        String(
          order.customer_phone || ""
        ).toLowerCase();


      return (
        orderId.includes(currentOrderSearch) ||
        customerName.includes(currentOrderSearch) ||
        customerPhone.includes(currentOrderSearch)
      );

    });

}


if (filteredOrders.length === 0) {

  ordersList.innerHTML =
    `<p>No ${currentOrderFilter} orders.</p>`;

  return;
}


ordersList.innerHTML = "";


filteredOrders.forEach(order => {

    const orderCard =
      document.createElement("div");

    orderCard.className =
      "order-card";


    // Format date
    const orderDate =
      new Date(
        order.created_at
      ).toLocaleString();


    // Build products inside order
    const itemsHTML =
      Array.isArray(order.items)

        ? order.items
            .map(item => {

              const quantity =
                Number(item.quantity) || 1;

              const price =
                Number(item.price) || 0;

              const subtotal =
                price * quantity;


              return `
                <div class="order-item">

                  <strong>
                    ${item.name}
                  </strong>

                  <p>
                    Size:
                    ${item.size || "Not specified"}
                  </p>

                  <p>
                    Quantity:
                    ${quantity}
                  </p>

                  <p>
                    ₦${price.toLocaleString()}
                    each
                  </p>

                  <p>
                    Subtotal:
                    ₦${subtotal.toLocaleString()}
                  </p>

                </div>
              `;

            })
            .join("")

        : "<p>No product information.</p>";


    const paymentStatus =
      order.payment_status ||
      "pending";


    orderCard.innerHTML = `

      <div class="order-card-header">

        <div>

          <h3>
            Order #${order.id}
          </h3>

          <p class="order-date">
            ${orderDate}
          </p>

        </div>


        <span
          class="order-status ${paymentStatus.toLowerCase()}"
        >
          ${paymentStatus}
        </span>

      </div>


      <div class="order-customer">

        <p>
          <strong>Customer:</strong>
          ${order.customer_name}
        </p>

        <p>
          <strong>Phone:</strong>
          ${order.customer_phone}
        </p>

        <p>
          <strong>Delivery Address:</strong>
          ${order.delivery_address}
        </p>

      </div>


      <div class="order-items">

        ${itemsHTML}

      </div>


      <div class="order-total">

        <strong>
          Total:
          ₦${Number(order.total).toLocaleString()}
        </strong>

      </div>


    ${
  paymentStatus.toLowerCase() === "pending"

    ? `
      <div class="order-actions">

        <button
          class="confirm-payment-btn"
          onclick="confirmPayment(${order.id})"
        >
          Confirm Payment
        </button>

        <button
          class="cancel-order-btn"
          onclick="cancelOrder(${order.id})"
        >
          Cancel Order
        </button>

      </div>
    `

    : paymentStatus.toLowerCase() === "paid"

      ? `
        <p>
          <strong>
            Payment Confirmed ✓
          </strong>
        </p>
      `

      : `
        <p>
          <strong>
            Order Cancelled
          </strong>
        </p>
      `
}
    `;


    ordersList.appendChild(
      orderCard
    );

  });

}
// ================================
// CONFIRM ORDER PAYMENT
// ================================

async function confirmPayment(orderId) {

  const confirmed = confirm(
    `Confirm payment for Order #${orderId}?\n\n` +
    `Only continue if you have received and verified the customer's payment.`
  );

  if (!confirmed) {
    return;
  }


  const { error } =
    await supabaseClient.rpc(
      "confirm_order_payment",
      {
        p_order_id: orderId
      }
    );


  if (error) {

    console.error(
      "Payment confirmation error:",
      error
    );

    alert(
      "Payment could not be confirmed.\n\n" +
      error.message
    );

    return;
  }


  alert(
    `Order #${orderId} payment confirmed successfully.`
  );


  // Refresh orders and inventory
  await loadOrders();
  await loadInventory();

}
// ================================
// ORDER FILTER BUTTONS
// ================================

orderFilterButtons.forEach(button => {

  button.addEventListener("click", async () => {

    // Remove active style
    // from all filter buttons
    orderFilterButtons.forEach(btn => {
      btn.classList.remove("active");
    });


    // Highlight clicked button
    button.classList.add("active");


    // Save selected filter
    currentOrderFilter =
      button.dataset.orderFilter;


    // Display matching orders
    await loadOrders();

  });

});
// ================================
// ORDER SEARCH
// ================================

if (orderSearchInput) {

  orderSearchInput.addEventListener(
    "input",
    async () => {

      currentOrderSearch =
        orderSearchInput
          .value
          .trim()
          .toLowerCase();

      await loadOrders();

    }
  );

}
// ================================
// CANCEL ORDER
// ================================

async function cancelOrder(orderId) {

  const confirmed = confirm(
    `Cancel Order #${orderId}?\n\n` +
    `This should only be used for unpaid orders.`
  );


  if (!confirmed) {
    return;
  }


  const { error } =
    await supabaseClient
      .from("orders")
      .update({
        payment_status: "cancelled",
        order_status: "cancelled"
      })
      .eq("id", orderId)
      .eq("payment_status", "pending");


  if (error) {

    console.error(
      "Order cancellation error:",
      error
    );

    alert(
      "Order could not be cancelled.\n\n" +
      error.message
    );

    return;
  }


  alert(
    `Order #${orderId} has been cancelled.`
  );


  // Refresh orders
  await loadOrders();

}
// ================================
// ADMIN SIDEBAR PAGE NAVIGATION
// ================================

const adminNavLinks = document.querySelectorAll(".admin-nav-link");
const adminPages = document.querySelectorAll(".admin-page");
const adminPageTitle = document.querySelector(".admin-topbar h1");

adminNavLinks.forEach(link => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    const targetId = link.getAttribute("href").substring(1);

    // Hide all admin pages
    adminPages.forEach(page => {
      page.classList.remove("active-page");
    });

    // Remove active state from sidebar links
    adminNavLinks.forEach(navLink => {
      navLink.classList.remove("active");
    });

    // Show selected page
    const targetPage = document.getElementById(targetId);

    if (targetPage) {
      targetPage.classList.add("active-page");
    }

    // Dashboard includes both product and order statistics
  if (targetId === "dashboard-overview") {
  document.querySelector(".order-overview").classList.add("active-page");
  document.querySelector(".dashboard-charts").classList.add("active-page");
  }

    // Highlight selected sidebar link
    link.classList.add("active");

    // Update page heading
    adminPageTitle.textContent = link.textContent.trim();

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});

/* =====================================
   URBAN SOLE DASHBOARD ANALYTICS
===================================== */

let salesChartInstance = null;
let ordersChartInstance = null;

function updateDashboardCharts(orders) {
  console.log("CHART ORDERS:", orders);
  console.log("FIRST ORDER:", orders[0]);
  if (typeof Chart === "undefined") {
    console.error("Chart.js has not loaded.");
    return;
  }

  const salesCanvas = document.getElementById("sales-chart");
  const ordersCanvas = document.getElementById("orders-chart");

  if (!salesCanvas || !ordersCanvas) return;

  // Group confirmed revenue by month
  const monthlySales = new Map();

  // Show the last 6 calendar months
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    monthlySales.set(key, {
      label: date.toLocaleDateString("en-NG", {
        month: "short",
        year: "2-digit"
      }),
      revenue: 0
    });
  }

  orders.forEach(order => {
    const status = String(
      order.payment_status || ""
    ).toLowerCase();

    if (status !== "paid") return;

    const amount = Number(order.total || 0);
    const date = new Date(order.created_at);

    if (!Number.isFinite(amount) ||
        Number.isNaN(date.getTime())) {
      return;
    }

    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (monthlySales.has(key)) {
      monthlySales.get(key).revenue += amount;
    }
  });

  const months = Array.from(monthlySales.values());

  // Sales bar chart
  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  salesChartInstance = new Chart(salesCanvas, {
    type: "bar",
    data: {
      labels: months.map(month => month.label),
      datasets: [{
        label: "Confirmed Revenue (₦)",
        data: months.map(month => month.revenue),
        backgroundColor: "#ffbd00",
        hoverBackgroundColor: "#e5a900",
        borderRadius: 8,
        maxBarThickness: 48
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: "easeOutQuart"
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: context =>
              "₦" + Number(context.raw).toLocaleString("en-NG")
          }
        }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: value =>
              "₦" + Number(value).toLocaleString("en-NG")
          }
        }
      }
    }
  });

  // Order status counts
  const counts = {
    paid: 0,
    pending: 0,
    cancelled: 0
  };

  orders.forEach(order => {
    const status = String(
      order.payment_status || ""
    ).toLowerCase();

    if (status in counts) {
      counts[status]++;
    }
  });

  // Doughnut chart
  if (ordersChartInstance) {
    ordersChartInstance.destroy();
  }

  ordersChartInstance = new Chart(ordersCanvas, {
    type: "doughnut",
    data: {
      labels: ["Paid", "Pending", "Cancelled"],
      datasets: [{
        data: [
          counts.paid,
          counts.pending,
          counts.cancelled
        ],
        backgroundColor: [
          "#ffbd00",
          "#202124",
          "#d9dce1"
        ],
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      animation: {
        animateRotate: true,
        duration: 1100
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 18
          }
        }
      }
    }
  });
}
