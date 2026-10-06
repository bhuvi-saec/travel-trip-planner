document.addEventListener("DOMContentLoaded", () => {
  const selection = TravelPlanner.getSelection();
  const form = document.getElementById("confirm-form");
  const area = document.getElementById("confirmation-area");
  const summary = document.getElementById("confirm-summary");
  const messageBox = document.getElementById("confirm-message");
  const confirmedArea = document.getElementById("trip-confirmed");
  if (!selection) {
    summary.innerHTML = '<p>Your trip details are not here yet. Choose a destination and plan to get started.</p><a class="text-link" href="/destinations.html">Explore destinations ↗</a>';
    form.querySelector("button[type=submit]").disabled = true;
    return;
  }

  form.elements.name.value = selection.name || "";
  form.elements.email.value = selection.email || "";
  form.elements.phone.value = selection.phone || "";
  form.elements.travelers.value = selection.travelers || 1;
  form.elements.travelDate.value = selection.travelDate || "";
  form.elements.finalPrice.value = selection.finalPrice || selection.unitPrice;
  form.elements.finalPrice.min = "1";
  form.elements.travelDate.min = new Date().toISOString().slice(0, 10);

  const updateSummary = () => {
    const travelers = Math.max(1, Number(form.elements.travelers.value) || 1);
    summary.innerHTML = `<p class="eyebrow">YOUR TRIP, AT A GLANCE</p><h2>${TravelPlanner.escapeHTML(selection.destination)}</h2><p>${TravelPlanner.escapeHTML(selection.plan)} plan · ${TravelPlanner.escapeHTML(selection.duration)} days · ${travelers} ${travelers === 1 ? "traveler" : "travelers"}</p><p class="summary-price">${TravelPlanner.formatPrice(form.elements.finalPrice.value || selection.unitPrice * travelers)} <small>final total</small></p>${selection.negotiated ? '<span class="status-pill">Proposed price</span>' : ""}`;
  };
  updateSummary();
  form.elements.travelers.addEventListener("input", () => {
    if (!selection.negotiated) form.elements.finalPrice.value = selection.unitPrice * Math.max(1, Number(form.elements.travelers.value) || 1);
    updateSummary();
  });
  form.elements.finalPrice.addEventListener("input", updateSummary);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageBox.className = "message hidden";
    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone"),
      destination: selection.destination,
      destinationId: selection.destinationId,
      plan: selection.plan,
      travelers: Number(data.get("travelers")),
      travelDate: data.get("travelDate"),
      finalPrice: Number(data.get("finalPrice"))
    };
    try {
      const trip = await TravelPlanner.api("/api/trips", { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      area.classList.add("hidden");
      confirmedArea.classList.remove("hidden");
      const noticeStatus = trip.notificationStatus;
      const notificationSummary = noticeStatus
        ? `<section class="notification-summary"><p class="eyebrow">EMAIL NOTIFICATION</p><ul><li><strong>Email</strong><span>${TravelPlanner.escapeHTML(String(noticeStatus.email))}</span></li></ul></section>`
        : "";
      confirmedArea.innerHTML = `<section class="confirmation-card"><div class="confirmation-icon">✓</div><p class="eyebrow">IT'S REALLY HAPPENING</p><h1>Trip confirmed<br><em>successfully!</em></h1><p class="trip-id-label">YOUR TRIP ID</p><p class="trip-id">${TravelPlanner.escapeHTML(trip.tripId)}</p><div class="trip-detail-grid"><span>Destination<strong>${TravelPlanner.escapeHTML(trip.destination)}</strong></span><span>Plan<strong>${TravelPlanner.escapeHTML(trip.plan)}</strong></span><span>Travelers<strong>${TravelPlanner.escapeHTML(trip.travelers)}</strong></span><span>Travel date<strong>${TravelPlanner.formatDate(trip.travelDate)}</strong></span><span>Total price<strong>${TravelPlanner.formatPrice(trip.finalPrice)}</strong></span><span>Status<strong><span class="status-pill">Confirmed</span></strong></span></div>${notificationSummary}<a class="button button-dark" href="/mytrips.html">Find this trip in My Trips <span>↗</span></a></section>`;
      sessionStorage.removeItem("travelSelection");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      TravelPlanner.showMessage(messageBox, error.message, "error");
    }
  });
});
