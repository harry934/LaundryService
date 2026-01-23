const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';

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
            localStorage.setItem('lastLaundryOrderId', orderId); // Store for persistence

            // Send to Backend
            fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(res => res.json())
              .then(response => {
                  console.log('Backend Success:', response);
                  // Redirect to tracking page after 1.5s
                  setTimeout(() => {
                      window.location.href = 'track.html';
                  }, 1500);
              })
              .catch(err => console.error('Backend Error:', err));

            console.log('Order Saved:', data);

            // Show Success
            if (orderIdDisplay) orderIdDisplay.textContent = orderId;
            if (successAlert) {
                successAlert.style.display = 'block';
                successAlert.scrollIntoView({ behavior: 'smooth' });
            }
            // Reset form but keep OrderId in localStorage (already done above)
            orderForm.reset();
        });
    }

    // --- Track Order Handling ---
    const trackForm = document.getElementById('trackOrderForm');
    const trackResult = document.getElementById('track-result');
    
    if (trackForm) {
        // --- Persistence Check ---
        const lastOrderId = localStorage.getItem('lastLaundryOrderId');
        if (lastOrderId) {
            document.getElementById('track-order-id').value = lastOrderId;
            performTrack(lastOrderId);
        }

        trackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const trackInput = document.getElementById('track-order-id').value.trim();
            if (!trackInput) return;
            
            localStorage.setItem('lastLaundryOrderId', trackInput);
            performTrack(trackInput);
        });
    }

    function performTrack(orderId) {
        const trackResult = document.getElementById('track-result');
        const resultId = document.getElementById('res-id');
        const resultStatus = document.getElementById('res-status');
        const resultName = document.getElementById('res-name');

        // Search in LocalStorage (fallback)
        const orders = JSON.parse(localStorage.getItem('laundryOrders')) || [];
        const localOrder = orders.find(o => o.orderId === orderId);

        // Fetch from backend for latest status
        fetch(`http://localhost:3000/api/orders/${orderId}`)
            .then(res => {
                if(res.ok) return res.json();
                throw new Error('Not found');
            })
            .then(backendOrder => {
                updateTrackDisplay(backendOrder);
            })
            .catch(() => {
                if (localOrder) updateTrackDisplay(localOrder);
                else {
                    alert('Order Not Found. Please check your Order ID.');
                    if(trackResult) trackResult.style.display = 'none';
                }
            });

        function updateTrackDisplay(data) {
            if(!trackResult) return;
            
            resultId.textContent = data.orderId;
            const status = data.status || 'Pending';
            
            // Color Code Status
            let statusColor = '#ffc107'; 
            if(status === 'Washing') statusColor = '#17a2b8';
            if(status === 'Ironing') statusColor = '#6f42c1';
            if(status === 'Ready') statusColor = '#28a745';
            if(status === 'Delivered') statusColor = '#20c997';

            resultStatus.textContent = status;
            resultStatus.style.color = statusColor;
            resultStatus.style.fontWeight = 'bold';
            
            resultName.textContent = data.name;
            trackResult.style.display = 'block';

            // Update Progress Bar
            const stages = ['Pending', 'Washing', 'Ironing', 'Ready', 'Delivered'];
            stages.forEach(stage => {
                const circle = document.getElementById('step-' + stage);
                if (circle) {
                    circle.style.background = '#eee';
                    circle.style.color = '#333';
                }
            });

            const currentIdx = stages.indexOf(status);
            for(let i=0; i <= currentIdx; i++) {
                const circle = document.getElementById('step-' + stages[i]);
                if (circle) {
                    circle.style.background = '#2A9D8F'; // Green for completion
                    circle.style.color = '#fff';
                }
            }
            if(currentIdx !== -1) {
                const activeCircle = document.getElementById('step-' + stages[currentIdx]);
                if(status === 'Pending') activeCircle.style.background = '#ffc107';
                else if(status === 'Delivered') activeCircle.style.background = '#20c997';
                else activeCircle.style.background = '#17a2b8';
            }
        }
    }

    // --- Logout / Clear Session ---
    const logoutBtn = document.getElementById('logout-session');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('lastLaundryOrderId');
            window.location.reload();
        });
    // --- Dynamic Settings ---
    async function loadSettings() {
        try {
            const res = await fetch(`${API_BASE}/settings`);
            const s = await res.json();
            // Header phone
            const headerPhone = document.querySelector('.header-btn1');
            if(headerPhone) headerPhone.innerHTML = `<img src="assets/img/icon/call.png" alt=""> ${s.phone}`;
            // Footer phone & Email
            const contactLinks = document.querySelectorAll('.single-footer-caption ul li a');
            contactLinks.forEach(link => {
                if(link.innerText.includes('(01)')) link.innerText = s.phone;
                if(link.innerText.includes('support@')) link.innerText = s.email;
            });
        } catch (e) { console.error('Settings load failed', e); }
    }
    loadSettings();
    }
});
