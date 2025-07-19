const fs = require('fs');
const path = require('path');

// Load data from external file
const hotSpringMarkers = require('./exported-data.js');

// Clean HTML entities and formatting
const clean = (text = "") => {
  return text
    .replace(/<[^>]+>/g, '') // remove HTML tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#8203;/g, '')
    .replace(/&#11088;/g, '⭐')
    .replace(/\s+/g, ' ')
    .trim();
};

const csvRows = [
  'Name,Description,Address,Latitude,Longitude' // CSV Header
];

hotSpringMarkers.forEach(marker => {
  const name = `"${clean(marker.label)}"`;
  const description = `"${clean(marker.rating)}\n${clean(marker.accessibility)}\nWebsite: ${clean(marker.website)}\nMore Info: ${marker.url}"`;
  const address = `"${clean(marker.address)}"`;
  const lat = marker.lat;
  const lng = marker.lng;

  csvRows.push(`${name},${description},${address},${lat},${lng}`);
});

const outputPath = path.join(__dirname, 'hot_springs_map.csv');
fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf8');

console.log(`✅ CSV file created at ${outputPath}`);
