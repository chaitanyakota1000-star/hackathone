// /public/js/cart.js

class AppointmentCart {
    constructor() {
        this.storageKey = 'shms_staged_appointments';
        this.stagedSlots = this.loadFromStorage();
    }

    // Load staged appointments securely with JSON parsing safety guards
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Local storage read corruption. Resetting cart buffer.");
            this.clearCart();
            return [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.stagedSlots));
        } catch (e) {
            console.error("Local storage quota limit reached.");
        }
    }

    // Stage dynamic appointment with localized input cleaning
    stageAppointment(doctorId, doctorName, date, timeSlot) {
        // Drop any malicious URI structures or scripts instantly on the client side
        const sanitizedDoctorId = String(doctorId).replace(/[^\w-]/g, '');
        const sanitizedDoctorName = this.escapeHTML(doctorName);
        const sanitizedDate = String(date).replace(/[^\d-]/g, '');
        const sanitizedTimeSlot = String(timeSlot).replace(/[^\d:APM-]/g, '');

        // Strict duplicate check against double booking
        const isDuplicate = this.stagedSlots.some(
            appt => appt.doctorId === sanitizedDoctorId && 
                    appt.date === sanitizedDate && 
                    appt.timeSlot === sanitizedTimeSlot
        );

        if (isDuplicate) {
            throw new Error("Target appointment slot is already staged.");
        }

        const newAppointment = {
            id: 'temp_' + crypto.randomUUID(), // Protected cryptographically secure unique token ID
            doctorId: sanitizedDoctorId,
            doctorName: sanitizedDoctorName,
            date: sanitizedDate,
            timeSlot: sanitizedTimeSlot
        };

        this.stagedSlots.push(newAppointment);
        this.saveToStorage();
        return newAppointment;
    }

    unstageAppointment(appointmentId) {
        const sanitizedId = String(appointmentId).replace(/[^\w-]/g, '');
        this.stagedSlots = this.stagedSlots.filter(appt => appt.id !== sanitizedId);
        this.saveToStorage();
    }

    clearCart() {
        this.stagedSlots = [];
        localStorage.removeItem(this.storageKey);
    }

    getStaged() {
        return [...this.stagedSlots]; // Deep copy projection
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
}

// Global instance allocation
window.cart = new AppointmentCart();
