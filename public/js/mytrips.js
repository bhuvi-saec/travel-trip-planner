document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trip-search-form");
  const results = document.getElementById("trip-results");

  const tripCard = (trip) => {
    const reminderForm = trip.status === "Confirmed" && new Date(trip.travelDate) >= new Date(new Date().toISOString().slice(0, 10))
      ? `<form class="reminder-form" data-trip-id="${TravelPlanner.escapeHTML(trip.tripId)}"><label>Request a reminder using your booking email<input type="email" name="email" required value="${TravelPlanner.escapeHTML(trip.email)}"></label><button class="button button-outline" type="submit">Send trip reminder</button><p class="message hidden" aria-live="polite"></p></form>`
      : "";
    return `<article class="trip-card"><div class="trip-card-top"><div><p class="eyebrow">TRIP ID · ${TravelPlanner.escapeHTML(trip.tripId)}</p><h2>${TravelPlanner.escapeHTML(trip.destination)}</h2></div><span class="status-pill">${TravelPlanner.escapeHTML(trip.status)}</span></div><div class="trip-detail-grid"><span>Plan<strong>${TravelPlanner.escapeHTML(trip.plan)}</strong></span><span>Travelers<strong>${TravelPlanner.escapeHTML(trip.travelers)}</strong></span><span>Travel date<strong>${TravelPlanner.formatDate(trip.travelDate)}</strong></span><span>Final price<strong>${TravelPlanner.formatPrice(trip.finalPrice)}</strong></span></div>${reminderForm}</article>`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const search = form.elements.search.value.trim();
    results.innerHTML = '<p class="muted">Looking up your trip…</p>';
    try {
      if (search.includes("@")) {
        const trips = await TravelPlanner.api(`/api/trips?email=${encodeURIComponent(search)}`);
        results.innerHTML = trips.length ? trips.map(tripCard).join("") : '<div class="empty-state"><h2>No trips found just yet.</h2><p>Check the email address you booked with, or look up a trip by its Trip ID.</p></div>';
      } else {
        const trip = await TravelPlanner.api(`/api/trips/${encodeURIComponent(search)}`);
        results.innerHTML = tripCard(trip);
      }
    } catch (error) {
      results.innerHTML = `<div class="message error" role="alert">${TravelPlanner.escapeHTML(error.message)}</div>`;
    }
  });

  results.addEventListener("submit", async (event) => {
    const reminderForm = event.target.closest(".reminder-form");
    if (!reminderForm) return;
    event.preventDefault();

    const button = reminderForm.querySelector("button[type=submit]");
    const message = reminderForm.querySelector(".message");
    button.disabled = true;
    message.className = "message hidden";
    try {
      const response = await TravelPlanner.api(`/api/trips/${encodeURIComponent(reminderForm.dataset.tripId)}/reminder`, {
        method: "POST",
        body: JSON.stringify({ email: reminderForm.elements.email.value })
      });
      const status = response.notificationStatus || {};
      const sent = status.email === "sent";
      TravelPlanner.showMessage(
        message,
        sent ? "Email reminder sent to your booking address." : `Email reminder: ${String(status.email)}`,
        sent ? "success" : "error"
      );
      if (!sent) button.disabled = false;
    } catch (error) {
      TravelPlanner.showMessage(message, error.message, "error");
      button.disabled = false;
    }
  });
});
