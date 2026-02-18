const express = require('express');
const cors = require('cors');
const { fetchAndFilterData } = require('./cre-scraper');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// In-memory cache
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 4; // 4 hours

app.get('/api/stations', async (req, res) => {
  const now = Date.now();
  if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
    return res.json(cachedData);
  }

  try {
    console.log('Fetching fresh data from CRE...');
    const data = await fetchAndFilterData();
    cachedData = data;
    lastFetchTime = now;
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch gas prices' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
