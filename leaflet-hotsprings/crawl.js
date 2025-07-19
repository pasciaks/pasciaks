// Save as crawl-html.js
// Run: node crawl-html.js

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';

let START_URL = 'https://www.ultimatehotspringsguide.com/usa-hot-springs.html';
let BASE_DOMAIN = 'www.ultimatehotspringsguide.com';

const visited = new Set();
const queue = [START_URL];

async function crawl() {
  while (queue.length > 0) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      console.log('Fetching:', url);
      // const res = await fetch(url);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          'Accept': 'text/html'
        }
      });

      if (!res.ok) {
        console.error(`Failed to fetch ${url}: ${res.status}`);
        continue;
      }
      const html = await res.text();

      // Save HTML to file
      await saveHtml(url, html);

      // Find all .html links in this page (same domain only)
      const links = extractLinks(html, url);
      for (const link of links) {
        if (!visited.has(link)) {
          queue.push(link);
        }
      }
    } catch (err) {
      console.error('Error fetching', url, err);
    }
  }
  console.log('Crawling complete. Pages saved:', visited.size);
}

function extractLinks(html, baseUrl) {
  const links = [];
  const regex = /href=["']([^"']+\.html)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let link = match[1];
    try {
      // Resolve relative links
      link = new URL(link, baseUrl).href;
      const domain = new URL(link).hostname;
      if (domain === BASE_DOMAIN) {
        links.push(link);
      }
    } catch {
      // skip invalid URLs
    }
  }
  return links;
}

async function saveHtml(url, html) {
  const { pathname } = new URL(url);

  // Convert pathname to a safe filename, e.g., "/some-page.html" -> "some-page.html"
  // For root or slashes, replace slashes with underscores
  let filename = pathname === '/' ? 'index.html' : pathname.slice(1).replace(/\//g, '_');

  // Make sure directory exists
  await fs.mkdir('downloaded', { recursive: true });
  const filepath = path.join('downloaded', filename);

  await fs.writeFile(filepath, html, 'utf8');
  console.log(`Saved ${url} as ${filepath}`);
}

// Start crawling
crawl();