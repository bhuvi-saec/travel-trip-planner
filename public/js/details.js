document.addEventListener("DOMContentLoaded", async () => {
  const area = document.getElementById("destination-details");
  const errorBox = document.getElementById("details-error");
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    area.innerHTML = "";
    TravelPlanner.showMessage(errorBox, "Choose a destination from the destinations page.", "error");
    return;
  }
  try {
    const destination = await TravelPlanner.api(`/api/destinations/${encodeURIComponent(id)}`);
    const plans = [
      { name: "Basic", multiplier: 1, details: "Stay, breakfast, local transport, sightseeing" },
      { name: "Standard", multiplier: 1.5, details: "3 / 4 star stay, breakfast and dinner, guide" },
      { name: "Premium", multiplier: 2, details: "4 / 5 star stay, all meals, private transport" }
    ];
    area.innerHTML = `
      <section class="detail-hero"><img src="${TravelPlanner.escapeHTML(destination.image)}" alt="${TravelPlanner.escapeHTML(destination.name)}"><div class="detail-hero-content"><p class="eyebrow light">${TravelPlanner.escapeHTML(destination.location)} · ${TravelPlanner.escapeHTML(destination.duration)} DAYS</p><h1>${TravelPlanner.escapeHTML(destination.name)}</h1><p>${TravelPlanner.escapeHTML(destination.description)}</p><a class="button button-light" href="/plans.html?id=${encodeURIComponent(destination._id)}">Choose this destination <span>↗</span></a></div></section>
      <section class="detail-content"><div><p class="eyebrow">A FEW WAYS TO WANDER</p><h2>Make time for the good stuff.</h2><div class="activity-list">${(destination.activities || []).map((activity) => `<span>✳ &nbsp;${TravelPlanner.escapeHTML(activity)}</span>`).join("")}</div></div><aside class="detail-price"><p class="eyebrow">YOUR ESCAPE STARTS FROM</p><strong>${TravelPlanner.formatPrice(destination.price)}</strong><span>per person · ${TravelPlanner.escapeHTML(destination.duration)} days</span><a class="button button-dark button-full" href="/plans.html?id=${encodeURIComponent(destination._id)}">See available plans <span>↗</span></a></aside></section>
      <section class="available-plans"><p class="eyebrow">THREE WAYS TO MAKE IT YOURS</p><h2>Available travel plans</h2><div class="detail-plan-list">${plans.map((plan) => `<a class="detail-plan" href="/plans.html?id=${encodeURIComponent(destination._id)}"><span><strong>${plan.name}</strong><small>${plan.details}</small></span><b>${TravelPlanner.formatPrice(Math.round(destination.price * plan.multiplier))}<small> / person</small></b></a>`).join("")}</div></section>`;
  } catch (error) {
    area.innerHTML = "";
    TravelPlanner.showMessage(errorBox, error.message, "error");
  }
});
