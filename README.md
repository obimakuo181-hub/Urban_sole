# URBAN SOLE
## Website Architecture, Code Explanation and System Documentation

### 1. Project Overview

Urban Sole is an online thrift and sneaker e-commerce website developed to allow customers to browse footwear, view product information, add products to a shopping cart, and place orders.

The system also provides an administrative dashboard where the administrator can manage products, monitor orders, track payments, and manage inventory.

The website uses HTML, CSS, and JavaScript for its frontend, Supabase for database and inventory management, and Firebase Authentication for customer authentication and email verification.

The checkout process uses WhatsApp to communicate customer orders to the administrator. Customers do not make direct online card payments through the website.

### 2. Technologies Used

**HTML (HyperText Markup Language)**

HTML provides the structure of the website. It defines the different pages, including the homepage, contact page, signup page, login page, account page, and admin dashboard.

**CSS (Cascading Style Sheets)**

CSS controls the appearance and presentation of the website. It handles colours, layouts, typography, animations, responsiveness, buttons, navigation bars, and product cards.

**JavaScript**

JavaScript provides the functionality and interactivity of the website. It handles product loading, search, filtering, shopping cart operations, authentication interactions, checkout, order processing, and administrative operations.

**Supabase**

Supabase provides the database infrastructure. It stores product inventory, customer profile information, and order information. JavaScript communicates with Supabase to retrieve and manage the relevant records.

Row Level Security (RLS) is used to restrict database access according to configured permissions.

**Firebase Authentication**

Firebase Authentication manages customer authentication, including account creation, login, and email verification.

**WhatsApp Integration**

WhatsApp is used as the communication channel for submitting customer orders. The website prepares an order message containing relevant customer and purchase information.

### 3. Project Folder Structure

The project is organized into folders according to the responsibilities of the files.

- `index.html` – Main homepage.
- `assets/` – Contains images, logos, and 3D models.
- `css/` – Contains the website stylesheets.
  - `styles.css` – Homepage and main website styling.
  - `contact.css` – Contact page styling.
  - `signup.css` – Signup and customer account styling.
  - `admin.css` – Administrative dashboard styling.
- `js/` – Contains the JavaScript files.
  - `auth/` – Authentication, account, and customer profile functionality.
  - `admin/` – Administrative dashboard functionality.
  - `pages/` – Homepage and general page functionality.
- `pages/` – Contains customer-facing HTML pages.
- `admin/` – Contains the admin dashboard HTML page.

This structure separates the different parts of the application and makes the project easier to maintain and expand.

### 4. How the Homepage Works

The homepage is the main entry point of Urban Sole.

When a visitor opens the website, the HTML loads the page structure, CSS applies the visual design, and JavaScript initializes the interactive features.

The homepage includes:

- Navigation bar.
- Hero section with a 3D sneaker model.
- Featured products section.
- Product search and category filters.
- Shopping cart.
- Checkout interface.
- Customer account navigation.

The product information is retrieved from Supabase rather than relying entirely on hardcoded product information.

JavaScript requests the available product records from the database and dynamically displays them on the page.

Each product card displays information such as the product name, brand, price, image, and other available product details.

### 5. Product Management and Inventory

Urban Sole uses Supabase to manage product inventory.

The administrator can add, update, and delete products through the admin dashboard.

Product information includes:

- Product name.
- Brand.
- Category.
- Size.
- Condition.
- Price.
- Description.
- Product photographs.
- Quantity.
- Availability status.
- Date added.

When the administrator adds a product, JavaScript sends the product information to Supabase.

The database stores the information, and the customer-facing website retrieves the available products and displays them.

This means the administrator does not need to manually edit the homepage HTML whenever a new product is added.

### 6. Customer Authentication

Urban Sole uses Firebase Authentication to manage customer accounts.

Customers can create accounts using their name, email address, password, WhatsApp number, and delivery address.

The authentication process works as follows:

1. The customer completes the signup form.
2. JavaScript validates the submitted information.
3. Firebase Authentication creates the customer's authentication account.
4. Firebase sends an email verification message.
5. The customer verifies their email address.
6. The application uses the verified authentication identity when accessing protected customer profile functionality.

The authentication system ensures that customers can log in using their registered credentials.

### 7. Customer Profile Management

Customer profile information is stored in Supabase.

A Supabase Edge Function named `customer-profile` handles customer profile operations.

The function supports profile retrieval and profile saving.

It verifies the Firebase authentication token before allowing the relevant profile operations.

The function also checks whether the customer's email has been verified.

This allows the application to associate customer profile information with an authenticated user rather than relying only on information submitted through the browser.

The stored customer information includes the customer's name, email address, WhatsApp number, and delivery address.

### 8. Shopping Cart System

The shopping cart allows customers to select products they want to purchase.

When a customer clicks the Add to Cart button, JavaScript adds the selected product to the cart.

The cart handles:

- Product selection.
- Product quantities.
- Quantity adjustments.
- Removing products.
- Calculating item subtotals.
- Calculating the overall order total.

The cart updates its displayed information as customers make changes.

The customer can review the selected products and their prices before proceeding to checkout.

### 9. Checkout and WhatsApp Ordering

Urban Sole uses a WhatsApp-based checkout process instead of direct online card payment.

When the customer proceeds to checkout:

1. The application retrieves the customer's saved profile information.
2. The customer reviews the order.
3. JavaScript prepares the order information.
4. The order is recorded in the database through the application's order-processing functionality.
5. The application generates a WhatsApp message containing the customer's details and selected products.
6. WhatsApp opens with the prepared order message.

The order message includes:

- Customer's full name.
- Email address.
- WhatsApp number.
- Delivery address.
- Product names.
- Product quantities.
- Individual product prices.
- Total order amount.

The customer can then send the prepared message to the administrator.

The administrator communicates with the customer to arrange payment.

### 10. Order and Payment Management

The admin dashboard includes an order management section.

It allows the administrator to monitor customer orders and their payment status.

The dashboard displays statistics such as:

- Total Orders.
- Pending Payments.
- Paid Orders.
- Total Revenue.

The administrator can review orders and update payment confirmation statuses.

When a payment is confirmed, the corresponding order status is updated through the application's order management functionality.

The dashboard retrieves order information from Supabase and calculates the displayed statistics from the available order records.

### 11. Administrative Dashboard

The admin dashboard provides administrative functionality for managing the online store.

Its major sections include:

**Dashboard Statistics**

Displays order counts, pending payments, paid orders, and revenue.

**Product Management**

Allows the administrator to add, edit, and delete products.

**Inventory Management**

Allows the administrator to monitor available products and stock quantities.

**Order Management**

Displays customer orders and their details.

**Payment Management**

Allows the administrator to confirm customer payments and monitor payment statuses.

The dashboard communicates with Supabase to retrieve and update the relevant information.

Administrative access is intended to be restricted to authorized administrators.

### 12. Database and Security

Urban Sole uses Supabase as its database platform.

Database security is important because customer information includes personal details such as email addresses, telephone numbers, and delivery addresses.

The application uses Row Level Security (RLS) to control access to database records.

RLS policies determine which authenticated users can read, insert, update, or delete records.

Firebase Authentication identifies customers, while the customer-profile Edge Function verifies Firebase identity tokens before processing protected profile requests.

Database permissions must be configured so customers cannot access other customers' private information.

Administrative operations must also be restricted to authorized administrators.

Public frontend configuration must not expose privileged Supabase service-role keys or other server-side secrets.

### 13. Responsive Design

Urban Sole is designed to work on different screen sizes.

CSS media queries are used to adjust layouts for desktop, tablet, and mobile devices.

The responsive design covers:

- Navigation.
- Hero section.
- Product cards.
- Shopping cart.
- Checkout interface.
- Signup and login pages.
- Customer account pages.
- Admin dashboard.

This allows customers and administrators to access the website using different devices.

### 14. How the Different Components Work Together

The main application workflow can be summarized as follows:

1. A customer visits the homepage.
2. JavaScript retrieves available products from Supabase.
3. The customer browses products and adds selected items to the shopping cart.
4. The customer signs in or creates an account through Firebase Authentication.
5. The customer profile is retrieved from Supabase through the protected profile functionality.
6. The customer proceeds to checkout.
7. The application records the order and prepares the WhatsApp order message.
8. The administrator receives the order and communicates with the customer.
9. The administrator confirms payment through the admin dashboard.
10. Supabase stores the updated order information, and the dashboard reflects the latest statistics.

### 15. Conclusion

Urban Sole combines frontend development, database management, authentication, and third-party communication services to provide an e-commerce solution.

HTML provides the structure, CSS handles the visual presentation, and JavaScript manages the application's interactive functionality.

Supabase handles data storage and inventory management, Firebase Authentication manages customer identity and email verification, and WhatsApp provides the communication channel for customer orders.

The administrative dashboard allows the store administrator to manage products, monitor inventory, review customer orders, and confirm payments.

The application is organized into separate folders to improve maintainability and make future development easier.