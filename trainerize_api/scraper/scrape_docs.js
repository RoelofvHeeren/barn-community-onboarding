const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Starting Trainerize API Scraper...');

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 1. Authenticate
    console.log('Navigating to documentation...');
    await page.goto('https://developers.trainerize.com/reference', { waitUntil: 'networkidle0' });

    // Check for password prompt
    const needsAuth = await page.evaluate(() => {
        return !!document.querySelector('input[type="password"]');
    });

    if (needsAuth) {
        console.log('Authentication required. Entering password...');
        await page.type('input[type="password"]', 'tzAPI');
        await page.click('button');

        // Wait for a siderbar element to confirm login success instead of generic navigation
        console.log('Waiting for authentication to complete...');
        try {
            await page.waitForSelector('a[href*="/reference"]', { timeout: 60000 });
            console.log('Authenticated.');
        } catch (e) {
            console.error('Login timed out or failed. Saving screenshot to login_debug.png');
            await page.screenshot({ path: path.join(__dirname, 'login_debug.png') });
            throw e;
        }
    } else {
        console.log('No authentication prompt found (or already authenticated).');
    }

    // 2. Fetch Sidebar Map (Sitemap Strategy)
    console.log('Fetching API Map (Sidebar)...');

    // We use page.evaluate to run the fetch INSIDE the browser context so it has the cookies
    const sidebar = await page.evaluate(async () => {
        const response = await fetch('/trainerize/api-next/v2/branches/1.0/sidebar?page_type=reference');
        return await response.json();
    });

    const outputDir = path.join(__dirname, 'docs_dump');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    fs.writeFileSync(path.join(outputDir, 'sidebar_map.json'), JSON.stringify(sidebar, null, 2));
    console.log(`Saved sidebar map to ${outputDir}/sidebar_map.json`);

    // 3. Flatten list of pages to scrape
    const allSlugs = [];
    const processPages = (pages, category) => {
        pages.forEach(p => {
            if (p.slug) {
                allSlugs.push({ slug: p.slug, category: category });
            }
            if (p.pages && p.pages.length > 0) {
                processPages(p.pages, category || p.title);
            }
        });
    };

    sidebar.forEach(cat => processPages(cat.pages, cat.title));
    console.log(`Found ${allSlugs.length} pages to scrape.`);

    // 4. Scrape Pages Batch by Batch
    const CONCURRENCY = 5; // Be polite
    const results = [];

    for (let i = 0; i < allSlugs.length; i += CONCURRENCY) {
        const batch = allSlugs.slice(i, i + CONCURRENCY);
        console.log(`Scraping batch ${i} - ${i + batch.length} / ${allSlugs.length}...`);

        // We execute a batch of fetches inside the browser context
        const batchData = await page.evaluate(async (slugs) => {
            const batchResults = [];
            for (const item of slugs) {
                try {
                    // Add delay to be polite
                    await new Promise(r => setTimeout(r, 200));
                    const resp = await fetch(`/trainerize/api-next/v2/branches/1.0/reference/${item.slug}?dereference=true&reduce=false`);
                    const json = await resp.json();
                    batchResults.push({
                        meta: item,
                        data: json.data
                    });
                } catch (e) {
                    batchResults.push({ meta: item, error: e.message });
                }
            }
            return batchResults;
        }, batch);

        // Save batch results to disk immediately
        batchData.forEach(item => {
            if (!item.error) {
                const safeFilename = item.meta.slug.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
                fs.writeFileSync(path.join(outputDir, safeFilename), JSON.stringify(item.data, null, 2));
            } else {
                console.error(`Error scraping ${item.meta.slug}: ${item.error}`);
            }
        });
    }

    console.log('Scraping complete!');
    await browser.close();
})();
