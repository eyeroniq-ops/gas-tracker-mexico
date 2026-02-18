const axios = require('axios');
const xml2js = require('xml2js');

const PLACES_URL = 'https://publicacionexterna.azurewebsites.net/publicaciones/places';
const PRICES_URL = 'https://publicacionexterna.azurewebsites.net/publicaciones/prices';

// Helper to calculate distance in km between two coords
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

// Puebla Centro approximate coords
const PUEBLA_CENTER_LAT = 19.0414;
const PUEBLA_CENTER_LON = -98.2063;
const PUEBLA_RADIUS_KM = 30; // 30km radius covers Puebla city and surroundings

async function fetchAndFilterData() {
    const parser = new xml2js.Parser({ explicitArray: false });

    try {
        const [placesRes, pricesRes] = await Promise.all([
            axios.get(PLACES_URL),
            axios.get(PRICES_URL)
        ]);

        const placesData = await parser.parseStringPromise(placesRes.data);
        const pricesData = await parser.parseStringPromise(pricesRes.data);

        // 1. Process Places (Stations)
        // placesData.places.place is an array of stations
        const allPlaces = placesData.places.place;
        console.log(`[SERVER] Total places in XML: ${allPlaces?.length || 'undefined'}`);

        // Filter for valid coordinates only (Fetch ALL Mexico)
        const allStations = allPlaces.filter(place => {
            const lat = parseFloat(place.location.y);
            const lon = parseFloat(place.location.x);
            // Check if valid coords
            return !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0;
        });

        // Create a map for quick price lookup
        // pricesData.places.place is also an array. Note structure might differ slightly.
        const pricesMap = {};
        const allPrices = pricesData.places.place;

        // Ensure allPrices is an array (xml2js might return single object if only 1 item)
        const priceArray = Array.isArray(allPrices) ? allPrices : [allPrices];

        priceArray.forEach(p => {
            // p['@_place_id'] might be the ID depending on xml structure. 
            // usually it's p.$.place_id in xml2js if it's an attribute
            const id = p.$.place_id;
            const gasPrices = p.gas_price; // This is an array of fuel types

            const pricesObj = {};
            if (Array.isArray(gasPrices)) {
                gasPrices.forEach(gp => {
                    pricesObj[gp.$.type] = parseFloat(gp._);
                });
            } else if (gasPrices) {
                // Single price type
                pricesObj[gasPrices.$.type] = parseFloat(gasPrices._);
            }
            pricesMap[id] = pricesObj;
        });

        // Helper to determine brand from name
        function determineBrand(name, reportedBrand) {
            const lowerName = name.toLowerCase();
            // Known brands mapping
            if (lowerName.includes('bp') || lowerName.includes('british petroleum')) return 'BP';
            if (lowerName.includes('shell')) return 'Shell';
            if (lowerName.includes('mobil')) return 'Mobil';
            if (lowerName.includes('pemex') || lowerName.includes('petróleos mexicanos')) return 'Pemex';
            if (lowerName.includes('g500')) return 'G500';
            if (lowerName.includes('repsol')) return 'Repsol';
            if (lowerName.includes('total')) return 'Total';
            if (lowerName.includes('chevron')) return 'Chevron';
            if (lowerName.includes('arco')) return 'Arco';
            if (lowerName.includes('gulf')) return 'Gulf';
            if (lowerName.includes('valero')) return 'Valero';
            if (lowerName.includes('oktan')) return 'Oktan';
            if (lowerName.includes('hidrosina')) return 'Hidrosina';
            if (lowerName.includes('orsan')) return 'Orsan';
            if (lowerName.includes('oxxo') || lowerName.includes('oxxo gas')) return 'OXXO GAS';
            if (lowerName.includes('petro-7') || lowerName.includes('petro 7')) return 'Petro-7';
            if (lowerName.includes('costco')) return 'Costco';
            if (lowerName.includes('akron')) return 'Akron';
            if (lowerName.includes('windstar')) return 'Windstar';
            if (lowerName.includes('red energy')) return 'Red Energy';

            // Fallback to reported brand if it exists and isn't generic
            if (reportedBrand && reportedBrand.length > 2 && !reportedBrand.toLowerCase().includes('generic')) return reportedBrand;

            return 'Generica';
        }

        function cleanName(name) {
            return name
                .replace(/ESTACION DE SERVICIO/gi, '')
                .replace(/SERVICIO/gi, '')
                .replace(/GASOLINERA/gi, '')
                .replace(/S\.A\. DE C\.V\./gi, '')
                .replace(/SA DE CV/gi, '')
                .replace(/S\. DE R\.L\. DE C\.V\./gi, '')
                .trim();
        }

        // 2. Merge Data
        const mergedData = allStations.map(station => {
            const id = station.$.place_id;
            const prices = pricesMap[id] || {};

            return {
                id: id,
                name: cleanName(station.name),
                cre_id: station.cre_id,
                location: {
                    lat: parseFloat(station.location.y),
                    lng: parseFloat(station.location.x),
                    address: station.location.address_street
                },
                brand: determineBrand(station.name, station.brand),
                prices: {
                    regular: prices['regular'],
                    premium: prices['premium'],
                    diesel: prices['diesel']
                }
            };
        }).filter(s => s.prices.regular || s.prices.premium || s.prices.diesel); // Only return stations with at least one price

        console.log(`[SERVER] Final merged data count: ${mergedData.length}`);

        return {
            lastUpdated: new Date().toISOString(),
            stations: mergedData
        };

    } catch (error) {
        console.error("Error in fetchAndFilterData:", error);
        throw error;
    }
}

module.exports = { fetchAndFilterData };
