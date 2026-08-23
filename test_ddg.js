const puppeteer = require('puppeteer');
async function test() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('https://duckduckgo.com/?q=zuma+game&iax=images&ia=images', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'ddg.png' });
    console.log("Saved screenshot");
    await browser.close();
}
test();
