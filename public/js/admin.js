document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("destination-form");
  const messageBox = document.getElementById("admin-message");
  const requestList = document.getElementById("negotiation-list");
  const refreshButton = document.getElementById("refresh-negotiations");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageBox.className = "message hidden";
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    try {
      const destination = await TravelPlanner.api("/api/destinations", { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      TravelPlanner.showMessage(messageBox, `${destination.name} has been added to the destinations catalog.`);
    } catch (error) {
      TravelPlanner.showMessage(messageBox, error.message, "error");
    }
  });

  const loadNegotiations = async () => {
    requestList.innerHTML = '<p class="muted">Loading requests…</p>';
    try {
      const requests = await TravelPlanner.api("/api/negotiations");
      requestList.innerHTML = requests.length ? requests.map((request) => `
        <article class="request-card"><div class="request-heading"><div><p class="eyebrow">${TravelPlanner.escapeHTML(request.plan)} · ${TravelPlanner.escapeHTML(request.destination)}</p><h3>${TravelPlanner.escapeHTML(request.name)}</h3></div><span class="request-date">${TravelPlanner.formatDate(request.travelDate)}</span></div>
        <div class="request-meta"><span>${TravelPlanner.escapeHTML(request.email)}</span><span>${TravelPlanner.escapeHTML(request.phone)}</span><span>${TravelPlanner.escapeHTML(request.travelers)} travelers</span></div>
        <div class="request-prices"><span>Current price <strong>${TravelPlanner.formatPrice(request.currentPrice)}</strong></span><span>Proposed price <strong>${TravelPlanner.formatPrice(request.proposedPrice)}</strong></span></div>
        ${request.message ? `<p class="request-message">${TravelPlanner.escapeHTML(request.message)}</p>` : ""}</article>`).join("") : '<p class="muted">No negotiation requests yet.</p>';
    } catch (error) {
      requestList.innerHTML = `<div class="message error">${TravelPlanner.escapeHTML(error.message)}</div>`;
    }
  };

  refreshButton.addEventListener("click", loadNegotiations);
  loadNegotiations();
});
