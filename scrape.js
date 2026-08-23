const https = require('https');

async function searchBingImage(query) {
    const url = 'https://www.bing.com/images/search?q=' + encodeURIComponent(query + ' game icon');
    
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const regex = /(https:\/\/tse[0-9]\.mm\.bing\.net\/th\?id=OIP\.[^"&]+)/gi;
                let matches = [];
                let match;
                while ((match = regex.exec(data)) !== null) {
                    matches.push(match[1]);
                }
                resolve(matches);
            });
        }).on('error', reject);
    });
}

searchBingImage('zuma').then(images => {
    console.log('Found images:', images.length);
    console.log('First two:', images.slice(0, 2));
});
