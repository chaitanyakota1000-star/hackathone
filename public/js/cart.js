/**
 * Developer 2: Client-Side Logic (Power-Up Cart Management)
 * Manages the local staging cart for the Team Power-Up Shop.
 */

class PowerUpCart {
    constructor() {
        this.storageKey = 'quizsync_staged_upgrades';
        this.items = this.loadFromStorage();
    }

    // Load staged upgrades from localStorage with parsing error defenses
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error("Local storage read corruption. Resetting shop cart.");
            this.clearCart();
            return {};
        }
    }

    // Save cart state to localStorage
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        } catch (e) {
            console.error("Local storage quota limit reached. Cannot save cart.");
        }
    }

    /**
     * Add a power-up to the cart
     * @param {string} id - Unique identifier of the powerup
     * @param {string} name - Name of the powerup
     * @param {number} cost - Cost in points
     */
    addItem(id, name, cost) {
        // Sanitize input values dynamically to prevent parameter injection
        const sanitizedId = String(id).replace(/[^\w-]/g, '');
        const sanitizedName = this.escapeHTML(name);
        const sanitizedCost = parseInt(cost) || 0;

        if (this.items[sanitizedId]) {
            this.items[sanitizedId].quantity += 1;
        } else {
            this.items[sanitizedId] = {
                name: sanitizedName,
                cost: sanitizedCost,
                quantity: 1
            };
        }
        this.saveToStorage();
        this.syncUI();
    }

    /**
     * Decrement or remove a power-up from the cart
     * @param {string} id 
     */
    removeItem(id) {
        const sanitizedId = String(id).replace(/[^\w-]/g, '');
        if (this.items[sanitizedId]) {
            this.items[sanitizedId].quantity -= 1;
            if (this.items[sanitizedId].quantity <= 0) {
                delete this.items[sanitizedId];
            }
            this.saveToStorage();
            this.syncUI();
        }
    }

    // Empty the cart
    clearCart() {
        this.items = {};
        localStorage.removeItem(this.storageKey);
        this.syncUI();
    }

    getItems() {
        return { ...this.items }; // Returns clone projection
    }

    getTotalCost() {
        let cost = 0;
        Object.keys(this.items).forEach(id => {
            cost += this.items[id].cost * this.items[id].quantity;
        });
        return cost;
    }

    getTotalCount() {
        let count = 0;
        Object.keys(this.items).forEach(id => {
            count += this.items[id].quantity;
        });
        return count;
    }

    // Dynamic anti-XSS client utility
    escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }

    // Dynamic rendering of cart items inside index.html elements
    syncUI() {
        const cartItemsList = document.getElementById("cart-items-list");
        const cartTotalItems = document.getElementById("cart-total-items");
        const cartItemCount = document.getElementById("cart-item-count");
        const cartTotalCost = document.getElementById("cart-total-cost");
        const checkoutBtn = document.getElementById("checkout-button");

        if (!cartItemsList) return;

        cartItemsList.innerHTML = "";
        const keys = Object.keys(this.items);

        if (keys.length === 0) {
            cartItemsList.innerHTML = `
                <div class="empty-cart-msg" id="empty-cart-message">
                    No upgrades selected. Add power-ups from the shop.
                </div>
            `;
            if (checkoutBtn) {
                checkoutBtn.disabled = true;
                checkoutBtn.classList.add("disabled");
            }
        } else {
            keys.forEach(id => {
                const item = this.items[id];
                const itemDiv = document.createElement("div");
                itemDiv.className = "cart-item";
                itemDiv.innerHTML = `
                    <span class="cart-item-name">${this.escapeHTML(item.name)} (x${item.quantity})</span>
                    <div class="cart-item-meta">
                        <span class="cart-item-cost">${item.cost * item.quantity} pts</span>
                        <button class="remove-item-btn" onclick="removeFromCart('${this.escapeHTML(id)}')">✕</button>
                    </div>
                `;
                cartItemsList.appendChild(itemDiv);
            });

            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.classList.remove("disabled");
            }
        }

        // Update totals
        const totalCount = this.getTotalCount();
        const totalCost = this.getTotalCost();

        if (cartTotalItems) cartTotalItems.textContent = totalCount;
        if (cartItemCount) cartItemCount.textContent = totalCount;
        if (cartTotalCost) cartTotalCost.textContent = totalCost;
    }
}

// Global instance allocation
window.cart = new PowerUpCart();

// Map global functions to window scope for HTML onclick events compatibility
window.addToCart = function(id, name, cost) {
    if (window.cart) window.cart.addItem(id, name, cost);
};

window.removeFromCart = function(id) {
    if (window.cart) window.cart.removeItem(id);
};
