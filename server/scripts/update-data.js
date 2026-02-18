const fs = require('fs');
const path = require('path');
const { fetchAndFilterData } = require('../cre-scraper');

async function updateStations() {
    console.log('Fetching fresh gas station data...');
    try {
        const data = await fetchAndFilterData();
        console.log(`Fetched ${data.stations.length} stations.`);

        // From server/scripts/update-data.js -> server/cre-scraper -> ../../client/src/data/stations.json
        // __dirname is server/scripts
        const targetPath = path.join(__dirname, '../../client/src/data/stations.json');

        fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
        console.log(`Successfully updated ${targetPath}`);

    } catch (error) {
        console.error('Failed to update stations:', error);
        process.exit(1);
    }
}

updateStations();
