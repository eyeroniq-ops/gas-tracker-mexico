const fs = require('fs');
const path = require('path');
const { fetchAndFilterData } = require('../server/cre-scraper');

async function updateStations() {
    console.log('Fetching fresh gas station data...');
    try {
        const data = await fetchAndFilterData();
        console.log(`Fetched ${data.stations.length} stations.`);

        // Target the client/public directory
        const targetPath = path.join(__dirname, '../client/public/stations.json');

        fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
        console.log(`Successfully updated ${targetPath}`);

        // Also write a timestamp file if needed, but stations.json has lastUpdated
    } catch (error) {
        console.error('Failed to update stations:', error);
        process.exit(1);
    }
}

updateStations();
