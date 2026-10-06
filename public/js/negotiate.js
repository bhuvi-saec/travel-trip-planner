document.addEventListener("DOMContentLoaded", () => {
  const selection = TravelPlanner.getSelection();
  const summary = document.getElementById("negotiation-summary");
  const form = document.getElementById("negotiation-form");
  const messageBox = document.getElementById("negotiation-message");
  const dateInput = form.elements.travelDate;
  dateInput.min = new Date().toISOString().slice(0, 10);
  if (!selection) {
    summary.innerHTML = '<p>Choose a destination and plan first, then come back to discuss the details.</p><a class="text-link" href="/destinations.html">Explore destinations ↗</a>';
    form.querySelector("button[type=submit]").disabled = true;
    return;
  }

  const currentPriceFor = (travelers) => selection.unitPrice * travelers;
  const updateSummary = () => {
    const travelers = Math.min(50, Math.max(1, Number(form.elements.travelers.value) || 1));
    summary.innerHTML = `<p class="eyebrow">YOUR STARTING POINT</p><h2>${TravelPlanner.escapeHTML(selection.destination)}</h2><p>${TravelPlanner.escapeHTML(selection.plan)} plan · ${TravelPlanner.escapeHTML(selection.duration)} days</p><p class="summary-price">${TravelPlanner.formatPrice(currentPriceFor(travelers))} <small>current total for ${travelers} ${travelers === 1 ? "traveler" : "travelers"}</small></p><p class="muted">From ${TravelPlanner.formatPrice(selection.unitPrice)} per person</p>`;
    if (!form.elements.proposedPrice.dataset.edited) {
      form.elements.proposedPrice.value = currentPriceFor(travelers);
    }
  };
  updateSummary();
  form.elements.travelers.addEventListener("input", updateSummary);
  form.elements.proposedPrice.addEventListener("input", () => {
    form.elements.proposedPrice.dataset.edited = "true";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageBox.className = "message hidden";
    const formData = new FormData(form);
    const travelers = Number(formData.get("travelers"));
    const currentPrice = currentPriceFor(travelers);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      destination: selection.destination,
      destinationId: selection.destinationId,
      plan: selection.plan,
      travelers,
      travelDate: formData.get("travelDate"),
      currentPrice,
      proposedPrice: Number(formData.get("proposedPrice")),
      message: formData.get("message")
    };
    try {
      await TravelPlanner.api("/api/negotiations", { method: "POST", body: JSON.stringify(payload) });
      selection.travelers = travelers;
      selection.travelDate = payload.travelDate;
      selection.name = payload.name;
      selection.email = payload.email;
      selection.phone = payload.phone;
      selection.finalPrice = payload.proposedPrice;
      selection.negotiated = true;
      TravelPlanner.saveSelection(selection);
      TravelPlanner.showMessage(messageBox, "Your request is with our agency. You can confirm your trip with your proposed price below.");
      const continueButton = document.createElement("a");
      continueButton.className = "button button-dark button-full continue-button";
      continueButton.href = "/confirm.html?negotiated=1";
      continueButton.textContent = "Continue to trip confirmation ↗";
      form.append(continueButton);
      form.querySelector("button[type=submit]").disabled = true;
    } catch (error) {
      TravelPlanner.showMessage(messageBox, error.message, "error");
    }
  });
});
