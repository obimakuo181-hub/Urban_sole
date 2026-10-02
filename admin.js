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

let editingProductId = null;


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

    productData.photos = [];

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