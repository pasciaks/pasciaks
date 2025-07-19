import fs from 'fs/promises';
import path from 'path';

// Utility: decode HTML entities like &#8203;
function decodeHtmlEntities(text) {
  return text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
}

// Clean text from HTML tags
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

async function extractLatLongAndTitleFromHtml(html) {
  const iframeMatch = html.match(/<iframe[^>]+src="([^"]+generateMap[^"]+)"/);
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);

  const result = {};

  if (titleMatch) {
    result.title = decodeHtmlEntities(titleMatch[1].trim());
  }

  if (iframeMatch) {
    const src = iframeMatch[1];
    const latMatch = src.match(/[?&]lat=([-.\d]+)/);
    const longMatch = src.match(/[?&]long=([-.\d]+)/);

    if (latMatch && longMatch) {
      result.lat = parseFloat(latMatch[1]);
      result.long = parseFloat(longMatch[1]);
    }
  }

  // Extract div.paragraph blocks
  const divMatches = Array.from(html.matchAll(/<div[^>]*class="paragraph"[^>]*>([\s\S]*?)<\/div>/gi));

  for (const match of divMatches) {
    const divHtml = match[1]; // Don't strip HTML yet

    const plainText = stripHtml(divHtml);

    // Address, Website, Rating are usually in the same block
    if (plainText.includes('Address:') && plainText.includes('Website')) {
      const addressMatch = plainText.match(/Address:\s*(.+?)\s*Website:/);
      const ratingMatch = plainText.match(/Rating:\s*(.+)/);

      if (addressMatch) result.address = addressMatch[1].trim();
      if (ratingMatch) result.rating = ratingMatch[1].trim();

      // Extract actual website URL if anchor tag exists
      const websiteUrlMatch = divHtml.match(/Website:.*?<a[^>]+href="([^"]+)"/i);
      if (websiteUrlMatch) {
        result.website = websiteUrlMatch[1].trim();
      } else {
        // Fallback: get plain text if no anchor tag
        const fallbackWebsiteMatch = plainText.match(/Website:\s*(.+?)\s*(Rating:|$)/);
        if (fallbackWebsiteMatch) {
          result.website = fallbackWebsiteMatch[1].trim();
        }
      }
    }

    // Accessibility might be in a separate paragraph block
    if (plainText.includes('Accessibility:')) {
      const accessMatch = plainText.match(/Accessibility:\s*(.+)/);
      if (accessMatch) {
        result.accessibility = accessMatch[1].trim();
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}


async function extractAllFromFolder(folder = './downloaded') {
  const results = [];
  const files = await fs.readdir(folder);

  for (const file of files) {
    if (!file.endsWith('.html')) continue;
    if (file.startsWith("8203")) continue;

    const fullPath = path.join(folder, file);
    const html = await fs.readFile(fullPath, 'utf8');
    const data = await extractLatLongAndTitleFromHtml(html);

    if (data && data.lat && data.long) {
      results.push({
        url: "https://www.ultimatehotspringsguide.com/" + file,
        label: data.title || '',
        lat: data.lat,
        lng: data.long,
        address: data.address || '',
        website: data.website || '',
        rating: data.rating || '',
        accessibility: data.accessibility || ''
      });
    }
  }

  const jsOutput = `window.hotSpringMarkers = ${JSON.stringify(results, null, 2)};\n`;
  await fs.writeFile('data.js', jsOutput, 'utf8');

  console.log(`✅ Extracted ${results.length} entries. Results written to data.js`);
}

extractAllFromFolder().catch(console.error);
