document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("destination-list");
  const count = document.getElementById("destination-count");
  const errorBox = document.getElementById("destination-error");
  try {
    const destinations = await TravelPlanner.api("/api/destinations");
    count.textContent = `${destinations.length} ${destinations.length === 1 ? "place" : "places"} to explore`;
    if (!destinations.length) {
      list.innerHTML = '<p class="muted">No destinations yet. Check back soon.</p>';
      return;
    }
    list.innerHTML = destinations.map((destination) => `
      <article class="destination-card">
        <a class="card-image-wrap" href="/details.html?id=${encodeURIComponent(destination._id)}"><img src="${TravelPlanner.escapeHTML(destination.image)}" alt="${TravelPlanner.escapeHTML(destination.name)}" loading="lazy"><span class="image-tag">${TravelPlanner.escapeHTML(destination.duration)} days</span></a>
        <div class="destination-card-body"><p class="card-location">${TravelPlanner.escapeHTML(destination.location)}</p><h3>${TravelPlanner.escapeHTML(destination.name)}</h3><p class="card-description">${TravelPlanner.escapeHTML(destination.description)}</p><div class="activity-tags">${(destination.activities || []).slice(0, 3).map((activity) => `<span>${TravelPlanner.escapeHTML(activity)}</span>`).join("")}</div><div class="card-footer"><span>From <strong>${TravelPlanner.formatPrice(destination.price)}</strong> / person</span></div><div class="card-actions"><a class="button button-outline" href="/details.html?id=${encodeURIComponent(destination._id)}">View details</a><a class="button button-dark" href="/plans.html?id=${encodeURIComponent(destination._id)}">Select plan <span>↗</span></a></div></div>
      </article>`).join("");
  } catch (error) {
    list.innerHTML = "";
    TravelPlanner.showMessage(errorBox, error.message, "error");
  }
});
