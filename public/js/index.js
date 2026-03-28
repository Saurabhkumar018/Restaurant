// API base URL
const API_BASE = '/api';

// Global variables
let menuItems = [];
let cart = [];
let customerInfo = null;
let orderHistory = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    loadMenuItems();
    setupCategoryFilters();
    setupCustomerForm();
    loadOrderHistory();
});

// Load menu items from API
async function loadMenuItems() {
    try {
        const response = await fetch(`${API_BASE}/menu`);
        menuItems = await response.json();
        renderMenuItems();
    } catch (error) {
        console.error('Error loading menu items:', error);
        showNotification('Failed to load menu items', 'error');
    }
}

// Save customer information
async function saveCustomerInfo(customerData) {
    try {
        const response = await fetch(`${API_BASE}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });
        
        if (response.ok) {
            const customer = await response.json();
            return customer._id;
        } else {
            throw new Error('Failed to save customer information');
        }
    } catch (error) {
        console.error('Error saving customer:', error);
        throw error;
    }
}

// Confirm order function
async function confirmOrder() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    if (!customerInfo) {
        showNotification('Please fill out your information first.', 'error');
        toggleCart();
        document.getElementById('customer-form').scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    try {
        // First save customer if not already saved
        if (!customerInfo._id) {
            const customerId = await saveCustomerInfo(customerInfo);
            customerInfo._id = customerId;
        }
        
        // Calculate total
        const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Prepare order items
        const orderItems = cart.map(item => ({
            menuItemId: item._id || item.id,
            quantity: item.quantity,
            price: item.price,
            name: item.name
        }));
        
        // Create order
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customerId: customerInfo._id,
                items: orderItems,
                totalAmount: totalAmount
            })
        });
        
        if (response.ok) {
            const order = await response.json();
            
            // Show success message
            showNotification('Order confirmed! Receipt is available in Order History.', 'success');
            
            // Reset cart and update UI
            cart = [];
            updateCartCount();
            toggleCart();
            
            // Reload order history
            loadOrderHistory();
        } else {
            throw new Error('Failed to create order');
        }
    } catch (error) {
        console.error('Error confirming order:', error);
        showNotification('Failed to confirm order', 'error');
    }
}

// Load order history from API
async function loadOrderHistory() {
    try {
        const response = await fetch(`${API_BASE}/orders`);
        if (response.ok) {
            orderHistory = await response.json();
        }
    } catch (error) {
        console.error('Error loading order history:', error);
    }
}

// Setup customer form
function setupCustomerForm() {
    const form = document.getElementById('customer-info-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const mobile = document.getElementById('mobile').value;
        const table = document.getElementById('table').value;
        
        customerInfo = { name, mobile, table };
        
        try {
            // Save customer to database
            const customerId = await saveCustomerInfo(customerInfo);
            customerInfo._id = customerId;
            
            // Enable add to cart buttons
            document.querySelectorAll('.add-to-cart').forEach(btn => {
                btn.classList.remove('disabled');
            });
            
            // Update customer info in cart modal
            updateCustomerInfoSummary();
            
            // Show success message
            showNotification('Information saved! You can now add items to your cart.', 'success');
            
            // Scroll to menu
            document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            showNotification('Failed to save customer information', 'error');
        }
    });
}

// Update customer info summary in cart modal
function updateCustomerInfoSummary() {
    if (customerInfo) {
        document.getElementById('summary-name').textContent = `Name: ${customerInfo.name}`;
        document.getElementById('summary-mobile').textContent = `Mobile: ${customerInfo.mobile}`;
        document.getElementById('summary-table').textContent = `Table: ${customerInfo.table}`;
    }
}

// Render menu items
function renderMenuItems() {
    const menuContainer = document.querySelector('.menu-items');
    menuContainer.innerHTML = '';
    
    menuItems.forEach(item => {
        const menuItemElement = document.createElement('div');
        menuItemElement.classList.add('menu-item');
        menuItemElement.dataset.category = item.category;
        
        menuItemElement.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="item-info">
                <h3 class="item-title">${item.name}</h3>
                <p class="item-desc">${item.description}</p>
                <div class="item-bottom">
                    <div class="item-price">₹${item.price.toFixed(2)}</div>
                    <div class="add-to-cart disabled" onclick="addToCart('${item._id}')">
                        <i class="fas fa-plus"></i>
                    </div>
                </div>
            </div>
        `;
        
        menuContainer.appendChild(menuItemElement);
    });
}

// Setup category filters
function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Filter menu items
            const category = button.dataset.category;
            filterMenuItems(category);
        });
    });
}

// Filter menu items by category
function filterMenuItems(category) {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Add item to cart
function addToCart(itemId) {
    // Check if customer info is filled
    if (!customerInfo) {
        showNotification('Please fill out your information first before adding items to cart.', 'error');
        document.getElementById('customer-form').scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    const item = menuItems.find(menuItem => menuItem._id === itemId);
    const existingItem = cart.find(cartItem => cartItem._id === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...item,
            quantity: 1
        });
    }
    
    updateCartCount();
    showNotification(`${item.name} added to cart!`);
}

// Remove item from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item._id !== itemId);
    updateCartCount();
    renderCartItems();
}

// Update quantity of item in cart
function updateQuantity(itemId, change) {
    const item = cart.find(cartItem => cartItem._id === itemId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity < 1) {
            removeFromCart(itemId);
        } else {
            renderCartItems();
        }
    }
}

// Update cart count badge
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Render cart items
function renderCartItems() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalElement = document.getElementById('cart-total-price');
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotalElement.textContent = '₹0.00';
        return;
    }
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.classList.add('cart-item');
        
        cartItemElement.innerHTML = `
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name}</h4>
                <div class="cart-item-price">₹${item.price.toFixed(2)} x ${item.quantity}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity('${item._id}', -1)">-</button>
                <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                <button class="quantity-btn" onclick="updateQuantity('${item._id}', 1)">+</button>
                <span class="remove-item" onclick="removeFromCart('${item._id}')">
                    <i class="fas fa-trash"></i>
                </span>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
    });
    
    cartTotalElement.textContent = `₹${total.toFixed(2)}`;
}

// Toggle cart modal
function toggleCart() {
    const cartModal = document.getElementById('cart-modal');
    renderCartItems();
    
    if (cartModal.style.display === 'flex') {
        cartModal.style.display = 'none';
    } else {
        cartModal.style.display = 'flex';
    }
}

// Generate receipt for current order
function generateReceipt() {
    if (cart.length === 0 || !customerInfo) {
        showNotification('No order information available. Please place an order first.', 'error');
        return;
    }
    
    // Update customer info in receipt
    document.getElementById('receipt-customer-name').textContent = `Name: ${customerInfo.name}`;
    document.getElementById('receipt-customer-mobile').textContent = `Mobile: ${customerInfo.mobile}`;
    document.getElementById('receipt-customer-table').textContent = `Table: ${customerInfo.table}`;
    
    // Update order info
    document.getElementById('receipt-order-number').textContent = `Order #: TEMP`;
    
    const now = new Date();
    document.getElementById('receipt-order-date').textContent = `Date: ${now.toLocaleDateString()}`;
    document.getElementById('receipt-order-time').textContent = `Time: ${now.toLocaleTimeString()}`;
    
    // Update receipt items
    const receiptItemsContainer = document.getElementById('receipt-items-list');
    receiptItemsContainer.innerHTML = '';
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const receiptItemElement = document.createElement('div');
        receiptItemElement.classList.add('receipt-item');
        
        receiptItemElement.innerHTML = `
            <div>${item.quantity} x ${item.name}</div>
            <div>₹${itemTotal.toFixed(2)}</div>
        `;
        
        receiptItemsContainer.appendChild(receiptItemElement);
    });
    
    // Update total
    document.getElementById('receipt-total-amount').textContent = `₹${total.toFixed(2)}`;
    
    // Show receipt page
    document.getElementById('ordering-page').classList.add('hidden');
    document.getElementById('receipt-page').classList.remove('hidden');
    document.getElementById('order-history-page').classList.add('hidden');
    document.getElementById('item-management-page').classList.add('hidden');
    document.getElementById('item-form-page').classList.add('hidden');
}

// Start a new order
function newOrder() {
    // Reset cart and customer info
    cart = [];
    customerInfo = null;
    
    // Reset form
    document.getElementById('customer-info-form').reset();
    
    // Disable add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.classList.add('disabled');
    });
    
    // Update cart count
    updateCartCount();
    
    // Show ordering page
    showOrderingPage();
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Show notification
    showNotification('Started a new order. Please fill out your information.', 'info');
}

// Print receipt
function printReceipt() {
    window.print();
}

// Show ordering page
function showOrderingPage() {
    document.getElementById('ordering-page').classList.remove('hidden');
    document.getElementById('receipt-page').classList.add('hidden');
    document.getElementById('order-history-page').classList.add('hidden');
    document.getElementById('item-management-page').classList.add('hidden');
    document.getElementById('item-form-page').classList.add('hidden');
    
    // Refresh menu items when returning to ordering page
    renderMenuItems();
}

// Show receipt page
function showReceiptPage() {
    if (orderHistory.length === 0) {
        showNotification('No order history available. Please place an order first.', 'error');
        return;
    }
    
    document.getElementById('ordering-page').classList.add('hidden');
    document.getElementById('receipt-page').classList.add('hidden');
    document.getElementById('order-history-page').classList.remove('hidden');
    document.getElementById('item-management-page').classList.add('hidden');
    document.getElementById('item-form-page').classList.add('hidden');
    renderOrderHistory();
}

// Show order history
function showOrderHistory() {
    if (orderHistory.length === 0) {
        showNotification('No order history available. Please place an order first.', 'error');
        return;
    }
    
    document.getElementById('ordering-page').classList.add('hidden');
    document.getElementById('receipt-page').classList.add('hidden');
    document.getElementById('order-history-page').classList.remove('hidden');
    document.getElementById('item-management-page').classList.add('hidden');
    document.getElementById('item-form-page').classList.add('hidden');
    renderOrderHistory();
}

// Render order history
function renderOrderHistory() {
    const orderListContainer = document.getElementById('order-list');
    orderListContainer.innerHTML = '';
    
    if (orderHistory.length === 0) {
        orderListContainer.innerHTML = '<p class="empty-order">No orders found</p>';
        return;
    }
    
    // Show orders in reverse chronological order (newest first)
    orderHistory.slice().reverse().forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.classList.add('order-item');
        orderElement.onclick = () => showOrderReceipt(order);
        
        const orderDate = new Date(order.orderDate);
        const formattedDate = orderDate.toLocaleDateString();
        const formattedTime = orderDate.toLocaleTimeString();
        
        // Calculate total
        const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        orderElement.innerHTML = `
            <div class="order-header">
                <div class="order-number">Order #${order.orderNumber}</div>
                <div class="order-date">${formattedDate} at ${formattedTime}</div>
            </div>
            <div class="order-details">
                <div><strong>Customer:</strong> ${order.customerId.name}</div>
                <div><strong>Table:</strong> ${order.customerId.table}</div>
                <div><strong>Items:</strong> ${order.items.length}</div>
            </div>
            <div class="order-total">Total: ₹${total.toFixed(2)}</div>
        `;
        
        orderListContainer.appendChild(orderElement);
    });
}

// Show receipt for a specific order
function showOrderReceipt(order) {
    // Update customer info in receipt
    document.getElementById('receipt-customer-name').textContent = `Name: ${order.customerId.name}`;
    document.getElementById('receipt-customer-mobile').textContent = `Mobile: ${order.customerId.mobile}`;
    document.getElementById('receipt-customer-table').textContent = `Table: ${order.customerId.table}`;
    
    // Update order info
    document.getElementById('receipt-order-number').textContent = `Order #: ${order.orderNumber}`;
    
    const orderDate = new Date(order.orderDate);
    document.getElementById('receipt-order-date').textContent = `Date: ${orderDate.toLocaleDateString()}`;
    document.getElementById('receipt-order-time').textContent = `Time: ${orderDate.toLocaleTimeString()}`;
    
    // Update receipt items
    const receiptItemsContainer = document.getElementById('receipt-items-list');
    receiptItemsContainer.innerHTML = '';
    
    let total = 0;
    
    order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const receiptItemElement = document.createElement('div');
        receiptItemElement.classList.add('receipt-item');
        
        receiptItemElement.innerHTML = `
            <div>${item.quantity} x ${item.name}</div>
            <div>₹${itemTotal.toFixed(2)}</div>
        `;
        
        receiptItemsContainer.appendChild(receiptItemElement);
    });
    
    // Update total
    document.getElementById('receipt-total-amount').textContent = `₹${total.toFixed(2)}`;
    
    // Show receipt page
    document.getElementById('ordering-page').classList.add('hidden');
    document.getElementById('receipt-page').classList.remove('hidden');
    document.getElementById('order-history-page').classList.add('hidden');
    document.getElementById('item-management-page').classList.add('hidden');
    document.getElementById('item-form-page').classList.add('hidden');
}

// Show item management page
function showItemManagement() {
    document.getElementById('ordering-page').classList.add('hidden');
    document.getElementById('receipt-page').classList.add('hidden');
    document.getElementById('order-history-page').classList.add('hidden');
    document.getElementById('item-management-page').classList.remove('hidden');
    document.getElementById('item-form-page').classList.add('hidden');
    
    renderItemsTable();
}

// Render items table for management
function renderItemsTable() {
    const tableBody = document.getElementById('items-table-body');
    tableBody.innerHTML = '';
    
    if (menuItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No menu items found</td></tr>';
        return;
    }
    
    menuItems.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><img src="${item.image}" alt="${item.name}" class="item-image-small"></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>${item.description}</td>
            <td class="action-buttons">
                <button class="btn-edit" onclick="editItem('${item._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="deleteItem('${item._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Show add item form
function showAddItemForm() {
    document.getElementById('item-form-title').textContent = 'Add New Menu Item';
    document.getElementById('item-id').value = '';
    document.getElementById('item-form').reset();
    
    document.getElementById('item-management-page').classList.add('hidden');
    document.getElementById('item-form-page').classList.remove('hidden');
}

// Edit item
async function editItem(itemId) {
    try {
        const response = await fetch(`${API_BASE}/menu/${itemId}`);
        if (response.ok) {
            const item = await response.json();
            
            document.getElementById('item-form-title').textContent = 'Edit Menu Item';
            document.getElementById('item-id').value = item._id;
            document.getElementById('item-name').value = item.name;
            document.getElementById('item-category').value = item.category;
            document.getElementById('item-price').value = item.price;
            document.getElementById('item-description').value = item.description;
            document.getElementById('item-image').value = item.image;
            
            document.getElementById('item-management-page').classList.add('hidden');
            document.getElementById('item-form-page').classList.remove('hidden');
        } else {
            throw new Error('Failed to fetch item details');
        }
    } catch (error) {
        console.error('Error fetching item:', error);
        showNotification('Failed to load item details', 'error');
    }
}

// Delete item
async function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            const response = await fetch(`${API_BASE}/menu/${itemId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove from local array
                const index = menuItems.findIndex(item => item._id === itemId);
                if (index !== -1) {
                    menuItems.splice(index, 1);
                }
                
                renderItemsTable();
                renderMenuItems(); // Update the menu display too
                showNotification('Item deleted successfully');
            } else {
                throw new Error('Failed to delete item');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showNotification('Failed to delete item', 'error');
        }
    }
}

// Cancel item form
function cancelItemForm() {
    document.getElementById('item-form-page').classList.add('hidden');
    document.getElementById('item-management-page').classList.remove('hidden');
}

// Handle item form submission
document.getElementById('item-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('item-id').value;
    const name = document.getElementById('item-name').value;
    const category = document.getElementById('item-category').value;
    const price = parseFloat(document.getElementById('item-price').value);
    const description = document.getElementById('item-description').value;
    const image = document.getElementById('item-image').value;
    
    const itemData = {
        name,
        category,
        price,
        description,
        image
    };
    
    try {
        if (itemId) {
            // Editing existing item
            const response = await fetch(`${API_BASE}/menu/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData)
            });
            
            if (response.ok) {
                const updatedItem = await response.json();
                
                // Update local array
                const index = menuItems.findIndex(item => item._id === itemId);
                if (index !== -1) {
                    menuItems[index] = updatedItem;
                }
                
                showNotification('Item updated successfully');
            } else {
                throw new Error('Failed to update item');
            }
        } else {
            // Adding new item
            const response = await fetch(`${API_BASE}/menu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData)
            });
            
            if (response.ok) {
                const newItem = await response.json();
                menuItems.push(newItem);
                showNotification('Item added successfully');
            } else {
                throw new Error('Failed to add item');
            }
        }
        
        // Update menu display if we're on the ordering page
        if (!document.getElementById('ordering-page').classList.contains('hidden')) {
            renderMenuItems();
        }
        
        // Go back to management page
        document.getElementById('item-form-page').classList.add('hidden');
        document.getElementById('item-management-page').classList.remove('hidden');
        renderItemsTable();
    } catch (error) {
        console.error('Error saving item:', error);
        showNotification('Failed to save item', 'error');
    }
});

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    
    if (type === 'success') {
        notification.style.background = 'var(--success)';
    } else if (type === 'error') {
        notification.style.background = 'var(--danger)';
    } else {
        notification.style.background = 'var(--info)';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}