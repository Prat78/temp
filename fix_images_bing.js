const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const http = require('http');

async function downloadBase64(url) {
    if (url.startsWith('//')) url = 'https:' + url;
    return new Promise((resolve, reject) => {
        const reqLib = url.startsWith('https') ? https : http;
        reqLib.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadBase64(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error('Status ' + res.statusCode));
            }
            let type = res.headers['content-type'] || 'image/jpeg';
            let chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                let buf = Buffer.concat(chunks);
                resolve('data:' + type + ';base64,' + buf.toString('base64'));
            });
        }).on('error', reject);
    });
}

async function run() {
    let gamesStr = fs.readFileSync('games.js', 'utf8');
    let games;
    eval(gamesStr.replace(/var\s+games\s*=/g, 'games ='));
    
    let brokenGames = [];
    for (let key in games) {
        if (!games[key].thumb || !games[key].thumb.startsWith('data:image')) {
            brokenGames.push(key);
        }
    }
    
    console.log(`Found ${brokenGames.length} games needing base64 images. Starting Bing browser...`);
    
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    // set standard user agent to avoid basic blocks
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    for (let i = 0; i < brokenGames.length; i++) {
        let gameName = brokenGames[i];
        console.log(`[${i+1}/${brokenGames.length}] Searching Bing for ${gameName}...`);
        
        try {
            await page.goto(`https://www.bing.com/images/search?q=${encodeURIComponent(gameName + ' game icon')}`, { waitUntil: 'networkidle2', timeout: 15000 }).catch(()=> {});
            
            await page.waitForSelector('img.mimg', { timeout: 5000 }).catch(() => {});
            
            const imgSrc = await page.evaluate(() => {
                const imgs = document.querySelectorAll('img.mimg');
                if (imgs.length > 1) {
                    return imgs[1].src || imgs[1].getAttribute('data-src');
                } else if (imgs.length > 0) {
                    return imgs[0].src || imgs[0].getAttribute('data-src');
                }
                return null;
            });
            
            if (imgSrc) {
                console.log(`-> Found image URL: ${imgSrc.substring(0, 50)}...`);
                try {
                    let b64 = await downloadBase64(imgSrc);
                    games[gameName].thumb = b64;
                    console.log(`-> Converted to base64 successfully!`);
                } catch(e) {
                    console.log(`-> Failed to download base64: ${e.message}`);
                }
            } else {
                console.log(`-> No image found`);
            }
        } catch (e) {
            console.log(`-> Error: ${e.message}`);
        }
        
        if ((i + 1) % 5 === 0) {
            const output = 'var games = ' + JSON.stringify(games, null, 4) + ';\n';
            fs.writeFileSync('games.js', output, 'utf8');
        }
    }
    
    const output = 'var games = ' + JSON.stringify(games, null, 4) + ';\n';
    fs.writeFileSync('games.js', output, 'utf8');
    console.log('Finished updating images to Base64!');
    await browser.close();
}

run();
