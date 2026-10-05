// ================================
// ELEMENTS
// ================================

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");
const logoutBtn = document.getElementById("logout-btn");

const productForm = document.getElementById("product-form");
const productMessage = document.getElementById("product-message");
const inventoryList = document.getElementById("inventory-list");
const ordersList = document.getElementById("orders-list");
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
      document.getElementById("product-status").value
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

const totalProducts = data.length;

const availableProducts = data.filter(
  product => product.status?.toLowerCase() === "available"
).length;

const soldProducts = data.filter(
  product => product.status?.toLowerCase() === "sold"
).length;

const lowStockProducts = data.filter(
  product => Number(product.quantity) <= 1
).length;


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
        Status: ${product.status}
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


  // Tell admin which product is being edited

  productMessage.textContent =
    `Editing: ${data.name}`;


  // Change button

  productForm
    .querySelector('button[type="submit"]')
    .textContent = "Save Changes";


  // Scroll to form

  productForm.scrollIntoView({
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


  if (data.length === 0) {

    ordersList.innerHTML =
      "<p>No orders yet.</p>";

    return;
  }


  ordersList.innerHTML = "";


  data.forEach(order => {

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
            <button
              class="confirm-payment-btn"
              onclick="confirmPayment(${order.id})"
            >
              Confirm Payment
            </button>
          `

          : `
            <p>
              <strong>
                Payment Confirmed ✓
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