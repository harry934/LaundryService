document.addEventListener('DOMContentLoaded', function() {
    // --- Order Form Handling ---
    const orderForm = document.getElementById('laundryOrderForm');
    const successAlert = document.getElementById('order-success');
    const orderIdDisplay = document.getElementById('display-order-id');

    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Basic Validation
            const inputs = orderForm.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = 'red';
                } else {
                    input.style.borderColor = '#ced4da';
                }
            });

            if (!isValid) return;

            const formData = new FormData(orderForm);
            const data = Object.fromEntries(formData.entries());

            // Generate Order ID: T-XXXXX
            const orderId = 'T-' + Math.floor(10000 + Math.random() * 90000);

            // Add ID and Metadata
            data.orderId = orderId;
            data.timestamp = new Date().toISOString();
            data.status = 'Pending'; // Initial status

            // Save to LocalStorage
            let orders = JSON.parse(localStorage.getItem('laundryOrders')) || [];
            orders.push(data);
            localStorage.setItem('laundryOrders', JSON.stringify(orders));

            // Send to Backend
            fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(res => res.json())
              .then(response => console.log('Backend Success:', response))
              .catch(err => console.error('Backend Error:', err));

            console.log('Order Saved:', data);

            // Show Success
            if (orderIdDisplay) orderIdDisplay.textContent = orderId;
            if (successAlert) {
                successAlert.style.display = 'block';
                successAlert.scrollIntoView({ behavior: 'smooth' });
            }
            orderForm.reset();
        });
    }

    // --- Track Order Handling ---
    const trackForm = document.getElementById('trackOrderForm');
    const trackResult = document.getElementById('track-result');
    
    if (trackForm) {
        trackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const trackInput = document.getElementById('track-order-id').value.trim();
            const resultDiv = document.getElementById('track-status-display');
            const resultId = document.getElementById('res-id');
            const resultStatus = document.getElementById('res-status');
            const resultName = document.getElementById('res-name');

            if (!trackInput) return;

            // Search in LocalStorage
            const orders = JSON.parse(localStorage.getItem('laundryOrders')) || [];
            const order = orders.find(o => o.orderId === trackInput);

            // Also try to fetch from backend for latest status
            fetch(`http://localhost:3000/api/orders/${trackInput}`)
                .then(res => {
                    if(res.ok) return res.json();
                    throw new Error('Not found');
                })
                .then(backendOrder => {
                    // Update display with backend data (more accurate status)
                    updateTrackDisplay(backendOrder);
                })
                .catch(() => {
                    // Fallback to local storage if backend fails or offline
                    if (order) updateTrackDisplay(order);
                    else {
                        alert('Order Not Found. Please check your Order ID.');
                        trackResult.style.display = 'none';
                    }
                });

            function updateTrackDisplay(data) {
                resultId.textContent = data.orderId;
                const status = data.status || 'Pending';
                
                // Color Code Status
                let statusColor = '#ffc107'; // yellow/pending
                if(status === 'Washing') statusColor = '#17a2b8';
                if(status === 'Ironing') statusColor = '#6f42c1';
                if(status === 'Ready') statusColor = '#28a745';
                if(status === 'Delivered') statusColor = '#20c997';

                resultStatus.textContent = status;
                resultStatus.style.color = statusColor;
                resultStatus.style.fontWeight = 'bold';
                
                resultName.textContent = data.name;
                trackResult.style.display = 'block';
            }
        });
    }
});
