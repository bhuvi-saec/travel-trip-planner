(() => {
  const api = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Something went wrong. Please try again.");
    return data;
  };

  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  const formatPrice = (value) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

  const formatDate = (value) => {
    if (!value) return "—";
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(value));
  };

  const showMessage = (element, message, type = "success") => {
    element.textContent = message;
    element.className = `message ${type}`;
  };

  const getSelection = () => {
    try {
      return JSON.parse(sessionStorage.getItem("travelSelection") || "null");
    } catch {
      return null;
    }
  };

  const saveSelection = (selection) => sessionStorage.setItem("travelSelection", JSON.stringify(selection));

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".main-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        nav.classList.toggle("nav-open", !expanded);
      });
    }

    const featured = document.getElementById("featured-destinations");
    if (featured) {
      api("/api/destinations")
        .then((destinations) => {
          if (!destinations.length) {
            featured.innerHTML = '<p class="muted">New destinations are on their way. Check back soon.</p>';
            return;
          }
          featured.innerHTML = destinations.slice(0, 3).map((destination) => `
            <article class="destination-card">
              <a class="card-image-wrap" href="/details.html?id=${encodeURIComponent(destination._id)}"><img src="${escapeHTML(destination.image)}" alt="${escapeHTML(destination.name)}" loading="lazy"><span class="image-tag">${escapeHTML(destination.duration)} days</span></a>
              <div class="destination-card-body"><p class="card-location">${escapeHTML(destination.location)}</p><h3>${escapeHTML(destination.name)}</h3><p class="card-description">${escapeHTML(destination.description)}</p><div class="card-footer"><span>From <strong>${formatPrice(destination.price)}</strong> / person</span><a class="card-arrow" href="/details.html?id=${encodeURIComponent(destination._id)}" aria-label="Explore ${escapeHTML(destination.name)}">↗</a></div></div>
            </article>`).join("");
        })
        .catch((error) => {
          featured.innerHTML = `<p class="message error">${escapeHTML(error.message)}</p>`;
        });
    }
  });

  window.TravelPlanner = { api, escapeHTML, formatPrice, formatDate, showMessage, getSelection, saveSelection };
})();
