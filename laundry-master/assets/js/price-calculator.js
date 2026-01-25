// Price Calculator for Booking Form
document.addEventListener('DOMContentLoaded', function() {
    const serviceCheckboxes = document.querySelectorAll('input[name="services[]"]');
    const priceSummary = document.getElementById('price-summary');
    const totalPriceEl = document.getElementById('total-price');
    
    if (serviceCheckboxes.length > 0 && priceSummary && totalPriceEl) {
        serviceCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', calculateTotal);
        });
        
        function calculateTotal() {
            let total = 0;
            let hasSelection = false;
            
            serviceCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    hasSelection = true;
                    const price = parseInt(checkbox.getAttribute('data-price')) || 0;
                    total += price;
                }
            });
            
            if (hasSelection) {
                priceSummary.style.display = 'block';
                totalPriceEl.textContent = 'KSh ' + total.toLocaleString();
            } else {
                priceSummary.style.display = 'none';
            }
        }
    }
});
