const API_BASE =
  window.location.protocol === "file:" ? "http://127.0.0.1:3000/api" : "/api";

document.addEventListener("DOMContentLoaded", function () {
  // --- Global Settings Sync ---
  async function syncSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const s = await res.json();
      
      // Update Phone
      const phoneElements = document.querySelectorAll(".header-btn1, .footer-number, .contact-phone, .support-call");
      phoneElements.forEach(el => {
        const icon = el.querySelector("img, i");
        el.innerText = s.phone;
        if (icon) el.prepend(icon);
      });

      // Update WhatsApp Link
      const waLinks = document.querySelectorAll("a[href*='wa.me']");
      waLinks.forEach(link => {
        link.href = `https://wa.me/${s.whatsapp.replace(/\D/g,'')}`;
      });

      // Emergency Stop Logic
      const orderForm = document.getElementById("laundryOrderForm");
      if (s.isOpen === false) {
        if (orderForm) {
            orderForm.style.opacity = "0.5";
            orderForm.style.pointerEvents = "none";
            const closedMsg = document.createElement("div");
            closedMsg.className = "alert alert-warning text-center mt-4";
            closedMsg.innerHTML = `<h4 style="font-weight:800">Shop Temporarily Closed</h4><p>We are currently not accepting new orders. Business Hours: ${s.hours}</p>`;
            orderForm.parentNode.prepend(closedMsg);
        }
      }
    } catch (e) {
      console.warn("Settings sync failed", e);
    }
  }
  syncSettings();

  // --- Order Form Handling ---
  const orderForm = document.getElementById("laundryOrderForm");
  const successAlert = document.getElementById("order-success");
  const orderIdDisplay = document.getElementById("display-order-id");

  if (orderForm) {
    orderForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Basic Validation
      const inputs = orderForm.querySelectorAll(
        "input[required], select[required]",
      );
      let isValid = true;
      inputs.forEach((input) => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = "red";
        } else {
          input.style.borderColor = "#eee";
        }
      });

      // Specific validation for at least one service
      const checkedServices = orderForm.querySelectorAll(
        'input[name="services[]"]:checked',
      );
      if (checkedServices.length === 0) {
        isValid = false;
        alert("Please select at least one service.");
      }

      if (!isValid) return;

      const formData = new FormData(orderForm);
      const data = {};

      // Handle regular fields
      formData.forEach((value, key) => {
        if (key === "services[]") {
          if (!data.services) data.services = [];
          data.services.push(value);
        } else {
          data[key] = value;
        }
      });

      // Format phone with prefix if needed
      if (!data.phone.startsWith("+254")) {
        data.phone = "+254" + data.phone.replace(/^0+/, "");
      }

      // Generate Order ID: T-XXXXX
      const orderId = "T-" + Math.floor(10000 + Math.random() * 90000);

      // Add ID and Metadata
      data.orderId = orderId;
      data.timestamp = new Date().toISOString();
      data.status = "Pending";

      // Save to LocalStorage
      let orders = JSON.parse(localStorage.getItem("laundryOrders")) || [];
      orders.push(data);
      localStorage.setItem("laundryOrders", JSON.stringify(orders));
      localStorage.setItem("lastLaundryOrderId", orderId);

      // Show Success UI
      if (orderIdDisplay) orderIdDisplay.textContent = orderId;
      if (successAlert) {
        successAlert.style.display = "block";
        successAlert.scrollIntoView({ behavior: "smooth" });
      }

      // Send to Backend
      fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then((response) => {
          console.log("Backend Success:", response);
          // Redirect to payment page after 2s
          setTimeout(() => {
            window.location.href = "payment.html";
          }, 2000);
        })
        .catch((err) => {
          console.error("Backend Error:", err);
          // Still redirect for design demo purposes if backend fails
          setTimeout(() => {
            window.location.href = "payment.html";
          }, 2000);
        });

      console.log("Order Saved:", data);
    });
  }

  // --- Track Order Handling ---
  const trackForm = document.getElementById("trackOrderForm");
  const trackResult = document.getElementById("track-result");

  if (trackForm) {
    // --- Persistence Check ---
    const lastOrderId = localStorage.getItem("lastLaundryOrderId");
    if (lastOrderId) {
      document.getElementById("track-order-id").value = lastOrderId;
      performTrack(lastOrderId);
    }

    trackForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const trackInput = document.getElementById("track-order-id").value.trim();
      if (!trackInput) return;

      localStorage.setItem("lastLaundryOrderId", trackInput);
      performTrack(trackInput);
    });
  }

  function performTrack(orderId) {
    const trackResult = document.getElementById("track-result");
    const resultId = document.getElementById("res-id");
    const resultStatus = document.getElementById("res-status");
    const resultName = document.getElementById("res-name");

    // Search in LocalStorage (fallback)
    const orders = JSON.parse(localStorage.getItem("laundryOrders")) || [];
    const localOrder = orders.find((o) => o.orderId === orderId);

    // Fetch from backend for latest status
    fetch(`http://localhost:3000/api/orders/${orderId}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not found");
      })
      .then((backendOrder) => {
        updateTrackDisplay(backendOrder);
      })
      .catch(() => {
        if (localOrder) updateTrackDisplay(localOrder);
        else {
          alert("Order Not Found. Please check your Order ID.");
          if (trackResult) trackResult.style.display = "none";
        }
      });

    function updateTrackDisplay(data) {
      if (!trackResult) return;

      resultId.textContent = data.orderId;
      const status = data.status || "Pending";
      const progressSection = document.getElementById("order-progress-section");
      const standbyMessage = document.getElementById("standby-message");

      // Handle Pending States
      if (status === "Pending" || status === "Payment Pending") {
        if (progressSection) progressSection.style.display = "none";
        if (standbyMessage) standbyMessage.style.display = "block";
      } else {
        if (progressSection) progressSection.style.display = "block";
        if (standbyMessage) standbyMessage.style.display = "none";
      }

      // Color Code Status
      let statusColor = "#ffc107";
      if (status === "Payment Pending") statusColor = "#ed8936";
      if (status === "Washing") statusColor = "#17a2b8";
      if (status === "Ironing") statusColor = "#6f42c1";
      if (status === "Ready") statusColor = "#28a745";
      if (status === "Delivered") statusColor = "#20c997";

      resultStatus.textContent = status;
      resultStatus.style.color = statusColor;
      resultStatus.style.fontWeight = "bold";

      resultName.textContent = data.name;
      trackResult.style.display = "block";

      // Update Progress Bar (only if showing)
      const stages = ["Pending", "Washing", "Ironing", "Ready", "Delivered"];
      stages.forEach((stage) => {
        const circle = document.getElementById("step-" + stage);
        if (circle) {
          circle.style.background = "#eee";
          circle.style.color = "#333";
        }
      });

      const currentIdx = stages.indexOf(status);
      if (currentIdx !== -1) {
        for (let i = 0; i <= currentIdx; i++) {
          const circle = document.getElementById("step-" + stages[i]);
          if (circle) {
            circle.style.background = "#2A9D8F"; 
            circle.style.color = "#fff";
          }
        }
        const activeCircle = document.getElementById("step-" + stages[currentIdx]);
        if (status === "Pending") activeCircle.style.background = "#ffc107";
        else if (status === "Delivered") activeCircle.style.background = "#20c997";
        else activeCircle.style.background = "#17a2b8";
      }
    }
  }

  // --- Logout / Clear Session ---
  const logoutBtn = document.getElementById("logout-session");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("lastLaundryOrderId");
      window.location.reload();
    });
    // --- Dynamic Settings ---
    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        const s = await res.json();
        // Header phone
        const headerPhone = document.querySelector(".header-btn1");
        if (headerPhone)
          headerPhone.innerHTML = `<img src="assets/img/icon/call.png" alt=""> ${s.phone}`;
        // Footer phone & Email
        const contactLinks = document.querySelectorAll(
          ".single-footer-caption ul li a",
        );
        contactLinks.forEach((link) => {
          if (link.innerText.includes("(01)")) link.innerText = s.phone;
          if (link.innerText.includes("support@")) link.innerText = s.email;
        });
      } catch (e) {
        console.error("Settings load failed", e);
      }
    }
    loadSettings();
  }
});
