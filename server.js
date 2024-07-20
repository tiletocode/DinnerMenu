const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

app.use(cors()); // CORS 허용

async function fetchContent(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const content = await page.content();
    await browser.close();

     // cheerio를 사용하여 HTML 파싱
    const $ = cheerio.load(content);
    
    // 모든 a 태그의 href 속성을 절대 URL로 변경
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('http')) {
            $(el).attr('href', new URL(href, url).href);
        }
    });
    
    // 수정된 HTML 반환
    return $.html();
}

app.get('/menu1', async (req, res) => {
    try {
        const content = await fetchContent('https://pf.kakao.com/_xnBcxdG/posts');
        res.send(content);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.get('/menu2', async (req, res) => {
    try {
        const content = await fetchContent('https://pf.kakao.com/_jxaNlG/posts');
        res.send(content);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.get('/menu3', async (req, res) => {
    try {
        const content = await fetchContent('https://pf.kakao.com/_xlCnNG/posts');
        res.send(content);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
