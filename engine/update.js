import fs from "node:fs/promises";

const DATA_PATH = new URL("../data/daily-rates.json", import.meta.url);
const isoNow = new Date().toISOString();
const data = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "PrasiddhBharatDailyRates/1.0" },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.json();
}

// Frankfurter exposes ECB reference rates, not retail bank cash/card quotes.
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

await updateCurrency();

// Other feeds remain unavailable until a dependable provider is configured.
// Never fill these categories with guessed or stale prices.
for (const key of ["goldSilver", "fuel", "stockMarket", "agriculture"]) {
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
