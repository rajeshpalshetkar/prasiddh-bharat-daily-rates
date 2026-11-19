import fs from "node:fs/promises";

const DATA_PATH = new URL("../data/daily-rates.json", import.meta.url);
const isoNow = new Date().toISOString();
const data = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "PrasiddhBharatDailyRates/1.0" },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from provider`);
  return response.json();
}

async function updateCurrency() {
  const section = data.sections.currency;
  try {
    const payload = await fetchJson("https://api.frankfurter.dev/v1/latest?base=INR&symbols=USD,EUR,GBP,JPY,CHF,AUD,CAD,SGD");
    const items = Object.entries(payload.rates ?? {}).map(([code, value]) => ({
      name: code, value, unit: `1 INR = ${code}`, direction: "foreign-per-INR"
    }));
    if (!items.length) throw new Error("FX provider returned no rates");
    section.status = "published";
    section.source = "Frankfurter API (ECB reference data)";
    section.observedAt = payload.date ?? isoNow.slice(0, 10);
    section.base = "INR";
    section.items = items;
    section.message = "हे ECB संदर्भ विनिमय दर आहेत; बँकेचे प्रत्यक्ष व्यवहार दर वेगळे असू शकतात.";
  } catch (error) {
    section.status = "unavailable";
    section.message = `चलन दर मिळवता आले नाहीत: ${error.message}`;
    section.items = [];
    section.observedAt = null;
    console.error("Currency update failed:", error.message);
  }
}

function field(record, name) {
  const key = Object.keys(record).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? record[key] : undefined;
}

async function updateAgriculture() {
  const section = data.sections.agriculture;
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) {
    section.status = "unavailable";
    section.source = "data.gov.in / AGMARKNET (API key required)";
    section.items = [];
    section.observedAt = null;
    section.message = "सरकारी डेटा मिळवण्यासाठी GitHub Secrets मध्ये DATA_GOV_IN_API_KEY जोडा.";
    return;
  }

  try {
    const url = new URL("https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070");
    url.searchParams.set("api-key", apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1000");
    url.searchParams.set("filters[state]", "Maharashtra");
    const payload = await fetchJson(url);
    const records = Array.isArray(payload.records) ? payload.records : [];
    const mapped = records.map(record => {
      const min = Number(field(record, "min_price"));
      const max = Number(field(record, "max_price"));
      const modal = Number(field(record, "modal_price"));
      return {
        state: field(record, "state") ?? "Maharashtra",
        district: field(record, "district") ?? "",
        market: field(record, "market") ?? "",
        commodity: field(record, "commodity") ?? "",
        variety: field(record, "variety") ?? "",
        grade: field(record, "grade") ?? "",
        arrivalDate: field(record, "arrival_date") ?? "",
        minPrice: Number.isFinite(min) ? min : null,
        maxPrice: Number.isFinite(max) ? max : null,
        modalPrice: Number.isFinite(modal) ? modal : null,
        unit: "₹/क्विंटल"
      };
    }).filter(item => item.commodity && item.market && item.modalPrice !== null);

    if (!mapped.length) throw new Error("API returned no usable Maharashtra mandi records");
    section.status = "published";
    section.source = "data.gov.in – AGMARKNET, Ministry of Agriculture & Farmers Welfare";
    section.observedAt = mapped.reduce((latest, item) => item.arrivalDate > latest ? item.arrivalDate : latest, "");
    section.items = mapped;
    section.message = "महाराष्ट्रातील बाजार समित्यांचे दैनिक घाऊक दर. दर ₹ प्रति क्विंटल.";
  } catch (error) {
    section.status = "unavailable";
    section.source = "data.gov.in / AGMARKNET";
    section.items = [];
    section.observedAt = null;
    section.message = `शेतीमालाचे दर मिळवता आले नाहीत: ${error.message}`;
    console.error("AGMARKNET update failed:", error.message);
  }
}

await Promise.all([updateCurrency(), updateAgriculture()]);

// Gold/silver, fuel and stock-market feeds remain unavailable until approved,
// dependable providers and publication rights are configured.
for (const key of ["goldSilver", "fuel", "stockMarket"]) {
  const section = data.sections[key];
  if (!section.source) {
    section.status = "unavailable";
    section.items = [];
    section.observedAt = null;
  }
}

data.generatedAt = isoNow;
data.lastUpdated = isoNow;
data.history = [{
  generatedAt: isoNow,
  statuses: Object.fromEntries(Object.entries(data.sections).map(([key, value]) => [key, value.status]))
}, ...(data.history ?? [])].slice(0, 30);

await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
console.log("Daily rates data updated:", data.lastUpdated);
console.log("Section statuses:", data.history[0].statuses);
