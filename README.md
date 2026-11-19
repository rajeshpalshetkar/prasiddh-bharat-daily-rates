# Prasiddh Bharat Daily Rates

Automated daily rates data engine and Blogger display layer.

## Sections
- Gold and silver
- Fuel: petrol, diesel, CNG and LPG
- Currency exchange
- Stock-market indices
- Agricultural market prices

## Data integrity
The engine must never invent, estimate, or silently reuse stale prices as current. Every published value must include its source and observation date/time. If a provider is unavailable or not configured, the section is marked unavailable.

Some Indian rate feeds require an approved API, subscription, or credentials. Store secrets only in GitHub Actions repository secrets; never commit API keys.

## Automation
GitHub Actions runs daily at 00:30 UTC (06:00 IST) and supports manual runs.

## Setup
1. Add legitimate provider credentials under Settings → Secrets and variables → Actions.
2. Run the workflow manually and inspect the Actions log.
3. Blogger page assets and JSON are served through jsDelivr.
4. Paste `blogger-page.html` into a Blogger Page in HTML view.

## Current provider coverage
The initial engine uses Frankfurter/ECB reference rates for currency data. Gold, fuel, stock indices and agricultural market prices remain unavailable until dependable providers are configured. No fabricated values are displayed.
