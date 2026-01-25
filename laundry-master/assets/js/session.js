/**
 * Session Manager (Frontend Only - Backend Disabled)
 * Navigation and basic session handling without backend
 */
(function() {
    // 1. Disable Back Button
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
        history.go(1);
    };

    // 2. Basic Session Persistence (Local Only)
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Note: Backend API calls have been removed
    // All data is now stored locally in localStorage only
    // To reconnect backend later, uncomment the API sections below
    
    /* BACKEND DISABLED - Uncomment when backend is ready
    const API_BASE = "YOUR_BACKEND_URL/api";
    
    async function checkOrderStatus() {
        if (!lastOrderId) return;
        try {
            const response = await fetch(`${API_BASE}/orders/${lastOrderId}`);
            const order = await response.json();
            // Handle order status
        } catch(e) {
            console.log('Backend not connected');
        }
    }
    */

    // 3. Admin Logout Helper (Local Only)
    window.adminLogout = function() {
        localStorage.removeItem('admin_session');
        localStorage.removeItem('user_role');
        localStorage.removeItem('laundryStaffUser');
        window.location.replace('index.html');
    }
    
    console.log('Session manager loaded (Frontend only mode)');
})();
