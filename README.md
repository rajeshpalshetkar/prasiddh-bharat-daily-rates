# Prasiddh Bharat Daily Rates

Automated daily rates data engine and Blogger display layer.

## Sections
- Gold and silver
- Fuel: petrol, diesel, CNG and LPG
- Currency exchange
- Stock-market indices
- Agricultural market prices

## Current data integrations

### Currency
Frankfurter API / ECB reference rates. These are indicative reference rates, not bank retail cash or card quotes.

### Agriculture
Official data.gov.in resource generated through AGMARKNET:
- Resource ID: `9ef84268-d588-465a-a308-a864a43d0070`
- Maharashtra records are requested.
- Fields include commodity, market, arrival date, minimum, maximum and modal wholesale price.
- Prices are displayed per quintal.
- Data is daily, not real-time.

To enable it:
1. Register/sign in at https://data.gov.in/.
2. Create or obtain an API key for the Open Government Data API.
3. In this repository open Settings → Secrets and variables → Actions → New repository secret.
4. Name the secret exactly `DATA_GOV_IN_API_KEY` and paste the key as its value.
5. Run Actions → Update Daily Rates → Run workflow.

### Gold and silver
IBJA's official API is a paid subscription. Its published terms restrict public redistribution/publication without prior written consent. This project does not scrape unofficial endpoints or publish IBJA values without documented permission. Contact IBJA for a subscription and written publication permission before enabling this section.

### Fuel and stock market
Not yet connected. These remain unavailable until reliable providers and publication terms are confirmed.

## Automation
GitHub Actions runs daily at 00:30 UTC (06:00 IST) and supports manual runs.

## Data integrity
The engine must never invent, estimate, or silently reuse stale prices as current. Each published value includes its source and observation date. If a provider is unavailable, the section is marked unavailable.

Store credentials only in GitHub Actions repository secrets; never commit API keys.

## Blogger
Paste `blogger-page.html` into a Blogger Page in HTML view. CSS, JavaScript and JSON are loaded from jsDelivr.
