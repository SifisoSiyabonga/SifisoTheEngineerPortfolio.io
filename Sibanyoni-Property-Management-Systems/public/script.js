// Define live backend server URL
// Code for Render Live link
const API_BASE_URL = 'https://sibanyoni-property-management-systems.onrender.com';

// Load maintenance tickets on page ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof loadUserTickets === 'function') {
    loadUserTickets();
  }
});

// 0. Register User (With Terms & Conditions Validation)
async function registerUser(event) {
  event.preventDefault();

  const termsCheckbox = document.getElementById('terms-checkbox');
  if (termsCheckbox && !termsCheckbox.checked) {
    alert('Please accept the Terms and Conditions to proceed.');
    return;
  }

  const payload = {
    username: document.getElementById('reg-username')?.value,
    email: document.getElementById('reg-email')?.value,
    password: document.getElementById('reg-password')?.value,
    agreedToTerms: termsCheckbox ? termsCheckbox.checked : false
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      alert('Registration successful!');
      window.location.href = 'login.html';
    } else {
      alert(data.error || 'Registration failed.');
    }
  } catch (err) {
    console.error('Registration error:', err);
  }
}

// 1. Submit Maintenance Ticket
async function submitTicket(event) {
  event.preventDefault();

  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert('User not logged in!');
    return;
  }

  const payload = {
    userId: userId,
    title: document.getElementById('m-title').value,
    category: document.getElementById('m-category').value,
    priority: document.getElementById('m-priority').value,
    description: document.getElementById('m-description').value
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/maintenance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      alert('Maintenance request submitted successfully!');
      document.getElementById('maintenance-form').reset();
      loadUserTickets();
    } else {
      alert(data.error || 'Failed to submit request');
    }
  } catch (err) {
    console.error('Submission error:', err);
  }
}

// 2. Fetch & Render User Maintenance Tickets
async function loadUserTickets() {
  const userId = localStorage.getItem('userId');
  const container = document.getElementById('tickets-list');
  if (!userId || !container) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/maintenance/user/${userId}`);
    const tickets = await res.json();

    container.innerHTML = '';

    if (!Array.isArray(tickets) || tickets.length === 0) {
      container.innerHTML = '<p style="color: #666;">No maintenance requests found.</p>';
      return;
    }

    tickets.forEach(ticket => {
      const card = document.createElement('div');
      card.style.cssText = 'border: 1px solid #ccc; padding: 12px; margin-bottom: 12px; border-radius: 6px; background: #f9f9f9;';
      card.innerHTML = `
        <h3 style="margin: 0 0 5px 0;">${ticket.title} <small style="color: #555;">(${ticket.category})</small></h3>
        <p style="margin: 4px 0;"><strong>Priority:</strong> ${ticket.priority}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> <span style="font-weight: bold; color: #007bff;">${ticket.status}</span></p>
        <p style="margin: 6px 0;">${ticket.description}</p>
        <small style="color: #777;">Submitted: ${new Date(ticket.createdAt).toLocaleDateString()}</small>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading tickets:', err);
  }
}