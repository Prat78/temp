const puppeteer = require('puppeteer');

async function testGoogle() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('https://www.google.com/search?tbm=isch&q=' + encodeURIComponent('zuma video game'), { waitUntil: 'networkidle2' });
    
    const imgSrc = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img.rg_i, img.YQ4gaf');
        if (imgs.length > 0) {
            return imgs[0].src || imgs[0].getAttribute('data-src');
        }
        return null;
    });
    console.log("Found image: ", imgSrc ? imgSrc.substring(0, 100) : 'none');
    await browser.close();
}
testGoogle();
