process.env.WHATAP_NAME = "menu-local";
var whatap = require('whatap').NodeAgent;

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const cheerio = require('cheerio');
const cron = require('node-cron');

const app = express();
const PORT = 3000;

app.use(cors());

// 캐시 객체
const cache = {
    menu1: null,
    menu2: null,
    menu3: null,
    menu4: null,
    menu5: null
};

async function fetchContent(url) {
    // root에서도 실행가능하게 sandbox 해제
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const content = await page.content();
    await browser.close();
    
    const $ = cheerio.load(content);
    
    // 링크 URL을 절대경로로 변경
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('http')) {
            $(el).attr('href', new URL(href, url).href);
        }
    });
    
    return $.html();
}

async function scrapeAndCache() {
    try {
        cache.menu1 = await fetchContent('https://pf.kakao.com/_xnBcxdG/posts');
        cache.menu2 = await fetchContent('https://pf.kakao.com/_jxaNlG/posts');
        cache.menu3 = await fetchContent('https://pf.kakao.com/_xlCnNG/posts');
        cache.menu4 = await fetchContent('https://www.instagram.com/so_dam_restaurant');
        cache.menu5 = await fetchContent('https://www.instagram.com/babplus_superstar');
        
        log('Scraping completed and cache updated');
    } catch (error) {
        logError(`Error during scraping: ${error}`, true);
    }
}

// log integration
function logWithTimestamp(message, isError = false) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0시를 12시로 변경
    const formattedHours = String(hours).padStart(2, '0');
    
    const timestamp = `${year}-${month}-${day} ${formattedHours}:${minutes}:${seconds} ${period}`;
    
    if (isError) {
        console.error(`[${timestamp}] ${message}`);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}
function log(message) {
    logWithTimestamp(message, false);
}
function logError(message) {
    logWithTimestamp(message, true);
}

// 평일(월-금)에만 1분마다 실행
cron.schedule('* * * * 1-5', () => {
    scrapeAndCache();
    log('Cron Scraping...');
});

// 서버 시작 시 최초 1회 스크래핑 실행
scrapeAndCache();
log('first scraping success.');

app.get('/menu1', (req, res) => {
    res.send(cache.menu1 || '오류가 발생하였습니다. 잠시 후 다시 시도하세요.');
});

app.get('/menu2', (req, res) => {
    res.send(cache.menu2 || '오류가 발생하였습니다. 잠시 후 다시 시도하세요.');
});

app.get('/menu3', (req, res) => {
    res.send(cache.menu3 || '오류가 발생하였습니다. 잠시 후 다시 시도하세요.');
});

app.get('/menu4', (req, res) => {
    res.send(cache.menu4 || '오류가 발생하였습니다. 잠시 후 다시 시도하세요.');
});

app.get('/menu5', (req, res) => {
    res.send(cache.menu5 || '오류가 발생하였습니다. 잠시 후 다시 시도하세요.');
});

app.listen(PORT, () => {
    log(`Server is running on http://localhost:${PORT}`);
});