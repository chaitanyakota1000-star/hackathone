/**
 * Jest Unit Test Suite for PowerUpCart (QuizSync)
 * Verifies local caching, shop additions, cost aggregations, and XSS sanitizations.
 */

const fs = require('fs');
const path = require('path');

describe('PowerUpCart Unit Tests', () => {
    let mockStore = {};

    beforeAll(() => {
        // 1. Mock Browser LocalStorage
        global.localStorage = {
            getItem: jest.fn((key) => mockStore[key] || null),
            setItem: jest.fn((key, value) => {
                mockStore[key] = String(value);
            }),
            removeItem: jest.fn((key) => {
                delete mockStore[key];
            }),
            clear: jest.fn(() => {
                mockStore = {};
            })
        };

        // 2. Mock window host object
        global.window = {};
    });

    beforeEach(() => {
        // Clear mock store and reload cart.js script inside sandbox context
        mockStore = {};
        jest.clearAllMocks();

        const cartScriptPath = path.resolve(__dirname, '../public/js/cart.js');
        const cartCode = fs.readFileSync(cartScriptPath, 'utf8');
        
        // Evaluate the raw code inside our Jest environment
        eval(cartCode);
    });

    // Test 1: Staging works correctly
    test('should correctly add a power-up item and save to localStorage', () => {
        const cart = window.cart;
        
        cart.addItem('double_points', 'Double Points', 150);

        // Verify cart buffer state
        const items = cart.getItems();
        expect(items['double_points']).toBeDefined();
        expect(items['double_points'].name).toBe('Double Points');
        expect(items['double_points'].cost).toBe(150);
        expect(items['double_points'].quantity).toBe(1);

        // Verify totals
        expect(cart.getTotalCount()).toBe(1);
        expect(cart.getTotalCost()).toBe(150);

        // Verify localStorage write was called
        expect(localStorage.setItem).toHaveBeenCalledWith(
            'quizsync_staged_upgrades',
            JSON.stringify(items)
        );
    });

    // Test 2: Handles quantities correctly
    test('should increment quantities for duplicate item additions instead of throwing errors', () => {
        const cart = window.cart;

        // Add item twice
        cart.addItem('time_freeze', 'Time Freeze', 100);
        cart.addItem('time_freeze', 'Time Freeze', 100);

        // Staged items should contain quantity 2
        const items = cart.getItems();
        expect(items['time_freeze']).toBeDefined();
        expect(items['time_freeze'].quantity).toBe(2);

        // Totals check
        expect(cart.getTotalCount()).toBe(2);
        expect(cart.getTotalCost()).toBe(200);
    });

    // Test 3: XSS defenses
    test('should escape malicious HTML inputs to prevent XSS injection vulnerabilities', () => {
        const cart = window.cart;

        const maliciousInput = '<script>alert("hack")</script>';
        const escapedOutput = cart.escapeHTML(maliciousInput);

        // Verify html entities replacement
        expect(escapedOutput).toBe('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;');
        expect(escapedOutput).not.toContain('<script>');
        expect(escapedOutput).not.toContain('"');

        // Check quote and ampersand characters replacement
        const specialChars = 'John & Co\'s "Upgrade" <Store>';
        const escapedSpecial = cart.escapeHTML(specialChars);
        expect(escapedSpecial).toBe('John &amp; Co&#39;s &quot;Upgrade&quot; &lt;Store&gt;');
    });

    // Test 4: Item Removal
    test('should decrement quantity or remove items from the cart', () => {
        const cart = window.cart;

        // Add 2 quantity of one item, and 1 of another
        cart.addItem('fifty_fifty', '50/50 Split', 200);
        cart.addItem('fifty_fifty', '50/50 Split', 200);
        cart.addItem('time_freeze', 'Time Freeze', 100);

        expect(cart.getTotalCount()).toBe(3);
        expect(cart.getTotalCost()).toBe(500);

        // Remove 1 fifty_fifty
        cart.removeItem('fifty_fifty');
        expect(cart.getItems()['fifty_fifty'].quantity).toBe(1);
        expect(cart.getTotalCount()).toBe(2);
        expect(cart.getTotalCost()).toBe(300);

        // Remove remaining fifty_fifty
        cart.removeItem('fifty_fifty');
        expect(cart.getItems()['fifty_fifty']).toBeUndefined();
        expect(cart.getTotalCount()).toBe(1);
        expect(cart.getTotalCost()).toBe(100);
    });
});
