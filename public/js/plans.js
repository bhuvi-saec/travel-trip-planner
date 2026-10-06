const planDefinitions = [
  { name: "Basic", multiplier: 1, label: "THE ESSENTIALS", features: ["Comfortable hotel stay", "Breakfast each day", "Local transportation", "Key sightseeing"] },
  { name: "Standard", multiplier: 1.5, label: "A LITTLE MORE", features: ["3 / 4 star hotel", "Breakfast and dinner", "Transportation included", "Sightseeing and tour guide"] },
  { name: "Premium", multiplier: 2, label: "THE FULL EXPERIENCE", features: ["4 / 5 star hotel", "All meals included", "Private transportation", "Tour guide and extra activities"] }
];

document.addEventListener("DOMContentLoaded", async () => {
  const heading = document.getElementById("plans-heading");
  const planArea = document.getElementById("plan-options");
  const errorBox = document.getElementById("plans-error");
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    heading.innerHTML = "";
    TravelPlanner.showMessage(errorBox, "Choose a destination before selecting a plan.", "error");
    return;
  }

  try {
    const destination = await TravelPlanner.api(`/api/destinations/${encodeURIComponent(id)}`);
    heading.innerHTML = `<p class="eyebrow">MAKE IT YOUR KIND OF TRIP</p><h1>Choose your <em>way to wander.</em></h1><p class="lead-copy">Plans for <strong>${TravelPlanner.escapeHTML(destination.name)}</strong> · ${TravelPlanner.escapeHTML(destination.duration)} days · prices per person</p>`;
    planArea.innerHTML = planDefinitions.map((plan) => {
      const unitPrice = Math.round(destination.price * plan.multiplier);
      return `<article class="plan-card ${plan.name === "Standard" ? "plan-featured" : ""}"><p class="eyebrow">${plan.label}</p><h2>${plan.name}</h2><p class="plan-price">${TravelPlanner.formatPrice(unitPrice)}<span> / person</span></p><ul>${plan.features.map((feature) => `<li>${TravelPlanner.escapeHTML(feature)}</li>`).join("")}</ul><p class="plan-total-note">Starting total for 1 traveler</p><button class="button ${plan.name === "Standard" ? "button-dark" : "button-outline"} button-full choose-plan" data-plan="${plan.name}" data-price="${unitPrice}">Choose ${plan.name} <span>↗</span></button></article>`;
    }).join("");

    planArea.addEventListener("click", (event) => {
      const button = event.target.closest(".choose-plan");
      if (!button) return;
      TravelPlanner.saveSelection({
        destinationId: destination._id,
        destination: destination.name,
        location: destination.location,
        duration: destination.duration,
        image: destination.image,
        plan: button.dataset.plan,
        unitPrice: Number(button.dataset.price),
        travelers: 1,
        finalPrice: Number(button.dataset.price)
      });
      location.href = "/confirm.html";
    });
  } catch (error) {
    heading.innerHTML = "";
    TravelPlanner.showMessage(errorBox, error.message, "error");
  }
});
