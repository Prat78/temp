const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
    let gamesStr = fs.readFileSync('games.js', 'utf8');
    let games;
    eval(gamesStr.replace(/var\s+games\s*=/g, 'games ='));
    
    let brokenGames = [];
    for (let key in games) {
        if (!games[key].thumb || games[key].thumb.includes('/png/games/')) {
            brokenGames.push(key);
        }
    }
    
    console.log(`Found ${brokenGames.length} games needing images. Starting browser...`);
    
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    for (let i = 0; i < brokenGames.length; i++) {
        let gameName = brokenGames[i];
        console.log(`[${i+1}/${brokenGames.length}] Searching for ${gameName}...`);
        
        try {
            await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(gameName + ' game')}&iax=images&ia=images`, { waitUntil: 'networkidle2', timeout: 15000 }).catch(()=> {});
            
            await page.waitForSelector('img.tile--img__img', { timeout: 5000 }).catch(() => {});
            
            // Get the second image src if available, else first
            const imgSrc = await page.evaluate(() => {
                const imgs = document.querySelectorAll('img.tile--img__img');
                if (imgs.length > 1) {
                    return imgs[1].src;
                } else if (imgs.length > 0) {
                    return imgs[0].src;
                }
                return null;
            });
            
            if (imgSrc) {
                console.log(`-> Found image: ${imgSrc.substring(0, 50)}...`);
                games[gameName].thumb = imgSrc;
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
    console.log('Finished updating images!');
    await browser.close();
}

run();
