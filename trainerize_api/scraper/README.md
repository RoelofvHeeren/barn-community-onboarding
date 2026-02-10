# Trainerize API Scraper

This scraper uses Puppeteer to automate the extraction of the Trainerize API documentation.

## Prerequisites
- Node.js installed.
- Internet connection (to download Chromium and access the site).

## Setup

1.  Navigate to this directory:
    ```bash
    cd trainerize_api/scraper
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

Run the scraper:

```bash
node scrape_docs.js
```

## How it works

1.  **Headless Browser**: Launches a headless Chrome instance.
2.  **Authentication**: Automatically logs in with the password `tzAPI` if prompted.
3.  **Sitemap Retrieval**:  Fetches the internal "sidebar map" from the Trainerize developer portal to get a list of all 180+ documentation pages.
4.  **Batch Scraping**: Iterates through every page, fetching the clean JSON data from the internal API (`/trainerize/api-next/v2/...`).
5.  **Output**: Saves each page's data as a separate JSON file in `trainerize_api/scraper/docs_dump/`.

## Troubleshooting

-   **TimeoutError**: If you see timeouts, try running with a better internet connection or increase the timeout in the script.
-   **Puppeteer Issues**: Ensure you have valid permissions to install/run Chromium.
