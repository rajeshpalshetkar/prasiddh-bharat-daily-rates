(() => {
  "use strict";
  const root = document.getElementById("pb-daily-rates");
  if (!root) return;
  const DATA_URL = "https://cdn.jsdelivr.net/gh/rajeshpalshetkar/prasiddh-bharat-daily-rates@main/data/daily-rates.json";
  const labels = {
    goldSilver: "सोने आणि चांदी",
    fuel: "इंधनाचे दर",
    currency: "चलन विनिमय",
    stockMarket: "शेअर बाजार",
    agriculture: "शेतीमालाचे बाजारभाव"
  };
  const statusText = { published: "अपडेट उपलब्ध", pending: "अपडेट प्रतीक्षेत", unavailable: "माहिती उपलब्ध नाही" };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const format = value => typeof value === "number" ? new Intl.NumberFormat("en-IN", {maximumFractionDigits:4}).format(value) : esc(value);
  function render(data) {
    const updated = data.lastUpdated ? new Date(data.lastUpdated).toLocaleString("mr-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}) : "अद्याप अपडेट नाही";
    root.querySelector(".pb-dr-updated").textContent = "शेवटचे इंजिन अपडेट: " + updated;
    root.querySelector(".pb-dr-sections").innerHTML = Object.entries(labels).map(([key,label]) => {
      const section = data.sections?.[key] ?? {};
      const rows = Array.isArray(section.items) && section.items.length
        ? '<div class="pb-dr-items">' + section.items.map(item => '<div class="pb-dr-item"><span>' + esc(item.name) + '</span><strong>' + format(item.value) + (item.unit ? '<small>' + esc(item.unit) + '</small>' : '') + '</strong></div>').join("") + '</div>'
        : '<p class="pb-dr-empty">' + esc(section.message || "विश्वसनीय माहिती उपलब्ध झाल्यावर येथे दाखवली जाईल.") + '</p>';
      const source = section.source ? '<small class="pb-dr-source">स्रोत: ' + esc(section.source) + (section.observedAt ? ' · माहितीची तारीख: ' + esc(section.observedAt) : '') + '</small>' : "";
      return '<section class="pb-dr-card"><div class="pb-dr-cardhead"><h2>' + label + '</h2><span class="pb-dr-status">' + esc(statusText[section.status] || "स्थिती अज्ञात") + '</span></div>' + rows + source + '</section>';
    }).join("");
  }
  async function load(force = false) {
    const status = root.querySelector(".pb-dr-statusline");
    status.textContent = "माहिती लोड होत आहे...";
    try {
      const response = await fetch(DATA_URL + (force ? "?t=" + Date.now() : ""), {cache:force ? "no-store" : "default"});
      if (!response.ok) throw new Error("HTTP " + response.status);
      render(await response.json());
      status.textContent = "माहिती यशस्वीरीत्या लोड झाली.";
    } catch (error) {
      status.textContent = "सध्या माहिती लोड होत नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.";
      console.error("Prasiddh Bharat daily rates:", error);
    }
  }
  root.querySelector(".pb-dr-refresh").addEventListener("click", () => load(true));
  load();
})();
