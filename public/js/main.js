// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ===== Mobile Nav Toggle =====
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // Close menu when clicking a link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
    });
  });
}

// ===== Contact Form =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);
    const resultDiv = document.getElementById('contactResult');

    try {
      const res = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      resultDiv.style.display = 'block';
      if (result.success) {
        resultDiv.className = 'form-result success';
        resultDiv.textContent = result.message;
        contactForm.reset();
      } else {
        resultDiv.className = 'form-result error';
        resultDiv.textContent = result.error || 'Something went wrong';
      }
    } catch {
      resultDiv.style.display = 'block';
      resultDiv.className = 'form-result error';
      resultDiv.textContent = 'Network error. Please try again.';
    }
  });
}

// ===== Gallery Filter =====
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    galleryItems.forEach(item => {
      if (filter === 'all' || item.dataset.category === filter) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  });
});

// ===== Booking Form =====
const bookingForm = document.getElementById('bookingForm');
const roomSelect = document.getElementById('room_id');
const checkInInput = document.getElementById('check_in');
const checkOutInput = document.getElementById('check_out');

// Set minimum date to today
if (checkInInput) {
  const today = new Date().toISOString().split('T')[0];
  checkInInput.min = today;
  checkInInput.addEventListener('change', () => {
    checkOutInput.min = checkInInput.value;
    updateSummary();
  });
  checkOutInput.addEventListener('change', updateSummary);
  if (roomSelect) roomSelect.addEventListener('change', updateSummary);
}

function updateSummary() {
  const summaryDiv = document.getElementById('bookingSummary');
  if (!roomSelect || !checkInInput || !checkOutInput || !summaryDiv) return;

  const selectedOption = roomSelect.options[roomSelect.selectedIndex];
  if (!roomSelect.value || !checkInInput.value || !checkOutInput.value) {
    summaryDiv.style.display = 'none';
    return;
  }

  const price = parseInt(selectedOption.dataset.price);
  const checkIn = new Date(checkInInput.value);
  const checkOut = new Date(checkOutInput.value);
  const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
  const total = price * nights;

  document.getElementById('summaryRoom').textContent = selectedOption.text;
  document.getElementById('summaryNights').textContent = nights;
  document.getElementById('summaryTotal').textContent = '₹' + total.toLocaleString();
  summaryDiv.style.display = 'block';
}

let currentBookingId = null;
let currentBookingAmount = 0;

if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(bookingForm);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch('/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (result.success) {
        currentBookingId = result.bookingId;
        currentBookingAmount = result.totalAmount;

        // Show payment step
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step2').classList.add('active');
        document.getElementById('paymentAmount').textContent = '₹' + result.totalAmount.toLocaleString();
      } else {
        alert(result.error || 'Booking failed');
      }
    } catch {
      alert('Network error. Please try again.');
    }
  });
}

// ===== Payment =====
const payBtn = document.getElementById('payBtn');
if (payBtn) {
  payBtn.addEventListener('click', async () => {
    if (!currentBookingId) return;

    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
    payBtn.disabled = true;
    payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
      const res = await fetch('/booking/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: currentBookingId,
          payment_method: paymentMethod
        })
      });
      const result = await res.json();

      if (result.success) {
        // Show confirmation
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step3').classList.add('active');

        document.getElementById('confirmationDetails').innerHTML = `
          <div class="summary-row"><span>Booking ID:</span> <span>#${result.booking.id}</span></div>
          <div class="summary-row"><span>Guest:</span> <span>${result.booking.guest_name}</span></div>
          <div class="summary-row"><span>Payment ID:</span> <span>${result.paymentId}</span></div>
          <div class="summary-row total"><span>Amount Paid:</span> <span>₹${result.booking.total_amount.toLocaleString()}</span></div>
        `;
      } else {
        alert(result.error || 'Payment failed');
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fas fa-lock"></i> Pay Now';
      }
    } catch {
      alert('Payment processing error. Please try again.');
      payBtn.disabled = false;
      payBtn.innerHTML = '<i class="fas fa-lock"></i> Pay Now';
    }
  });
}

// ===== Dashboard Tabs =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ===== Dashboard Status Update =====
document.querySelectorAll('.status-select').forEach(select => {
  select.addEventListener('change', async (e) => {
    const bookingId = e.target.dataset.bookingId;
    const status = e.target.value;

    try {
      await fetch(`/admin/booking/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch {
      alert('Failed to update status');
    }
  });
});

// ===== Mark Message as Read =====
document.querySelectorAll('.mark-read').forEach(btn => {
  btn.addEventListener('click', async () => {
    const contactId = btn.dataset.contactId;

    try {
      await fetch(`/admin/contact/${contactId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      btn.closest('.message-card').classList.remove('unread');
      btn.remove();
    } catch {
      alert('Failed to mark as read');
    }
  });
});
