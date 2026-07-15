/**
 * Developer 2: Client-Side Logic (Power-Up Cart Management)
 * Handles local state for the Team Power-Up Shop and coordinates checkout requests.
 */

// Cart state containing selected items
const cartState = {
    items: {}, // Maps id -> { name, cost, quantity }
    totalItems: 0,
    totalCost: 0
};

// Global variables/elements to bind
let teamPoints = 350; // Mock current local points (loaded from server in app.js)

// Initialize cart elements on load
document.addEventListener("DOMContentLoaded", () => {
    updateCartUI();

    const checkoutBtn = document.getElementById("checkout-button");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", checkoutUpgrades);
    }
});

/**
 * Add a power-up to the cart
 * @param {string} id Unique powerup ID
 * @param {string} name Display name
 * @param {number} cost Score points required
 */
function addToCart(id, name, cost) {
    if (cartState.items[id]) {
        cartState.items[id].quantity += 1;
    } else {
        cartState.items[id] = {
            name: name,
            cost: cost,
            quantity: 1
        };
    }
    recalculateCart();
    updateCartUI();
}

/**
 * Decrement or remove a power-up from the cart
 * @param {string} id Unique powerup ID
 */
function removeFromCart(id) {
    if (cartState.items[id]) {
        cartState.items[id].quantity -= 1;
        if (cartState.items[id].quantity <= 0) {
            delete cartState.items[id];
        }
        recalculateCart();
        updateCartUI();
    }
}

/**
 * Recalculate totals in the cart state
 */
function recalculateCart() {
    let totalItems = 0;
    let totalCost = 0;

    for (const id in cartState.items) {
        const item = cartState.items[id];
        totalItems += item.quantity;
        totalCost += item.cost * item.quantity;
    }

    cartState.totalItems = totalItems;
    cartState.totalCost = totalCost;
}

/**
 * Synchronize State with DOM Elements
 */
function updateCartUI() {
    const cartItemsList = document.getElementById("cart-items-list");
    const emptyCartMsg = document.getElementById("empty-cart-message");
    const cartTotalItems = document.getElementById("cart-total-items");
    const cartItemCount = document.getElementById("cart-item-count");
    const cartTotalCost = document.getElementById("cart-total-cost");
    const checkoutBtn = document.getElementById("checkout-button");

    if (!cartItemsList) return;

    // Clear previous items except the message if it's there
    cartItemsList.innerHTML = "";

    const keys = Object.keys(cartState.items);
    if (keys.length === 0) {
        // Show empty message
        if (emptyCartMsg) {
            cartItemsList.appendChild(emptyCartMsg);
        } else {
            cartItemsList.innerHTML = `<div class="empty-cart-msg" id="empty-cart-message">No upgrades selected. Add power-ups from the shop.</div>`;
        }
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add("disabled");
    } else {
        keys.forEach(id => {
            const item = cartState.items[id];
            const itemDiv = document.createElement("div");
            itemDiv.className = "cart-item";
            itemDiv.innerHTML = `
                <span class="cart-item-name">${item.name} (x${item.quantity})</span>
                <div class="cart-item-meta">
                    <span class="cart-item-cost">${item.cost * item.quantity} pts</span>
                    <button class="remove-item-btn" onclick="removeFromCart('${id}')">✕</button>
                </div>
            `;
            cartItemsList.appendChild(itemDiv);
        });

        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove("disabled");
    }

    // Set totals
    if (cartTotalItems) cartTotalItems.textContent = cartState.totalItems;
    if (cartItemCount) cartItemCount.textContent = cartState.totalItems;
    if (cartTotalCost) cartTotalCost.textContent = cartState.totalCost;
}

/**
 * Execute point checkout against the server API
 */
async function checkoutUpgrades() {
    if (cartState.totalCost > teamPoints) {
        alert(`Insufficient points! Your team has ${teamPoints} pts, but these upgrades require ${cartState.totalCost} pts.`);
        return;
    }

    const payload = {
        upgrades: Object.keys(cartState.items).map(id => ({
            id: id,
            quantity: cartState.items[id].quantity
        })),
        expectedCost: cartState.totalCost
    };

    try {
        const checkoutBtn = document.getElementById("checkout-button");
        checkoutBtn.textContent = "Processing Activation...";
        checkoutBtn.disabled = true;

        const response = await fetch("/api/shop/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Apply points changes locally
            teamPoints = result.updatedPoints;
            
            // Sync with global system displays
            if (typeof syncTeamPoints === 'function') {
                syncTeamPoints(teamPoints);
            }

            // Clear the cart
            cartState.items = {};
            recalculateCart();
            updateCartUI();

            alert("Team upgrades successfully activated!");
            
            // Trigger quick update of feeds if present
            if (typeof fetchActivityFeed === 'function') {
                fetchActivityFeed();
            }
        } else {
            alert(`Upgrade Activation Failed: ${result.error || "Unknown error occurred"}`);
        }
    } catch (error) {
        console.error("Error committing checkout request:", error);
        alert("Server communication error. Please try again.");
    } finally {
        const checkoutBtn = document.getElementById("checkout-button");
        if (checkoutBtn) {
            checkoutBtn.textContent = "Activate Team Upgrades";
            checkoutBtn.disabled = (cartState.totalItems === 0);
            if (cartState.totalItems === 0) {
                checkoutBtn.classList.add("disabled");
            } else {
                checkoutBtn.classList.remove("disabled");
            }
        }
    }
}
