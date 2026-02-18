export interface GasPrices {
    regular?: number;
    premium?: number;
    diesel?: number;
}

export interface Location {
    lat: number;
    lng: number;
    address?: string;
}

export interface Station {
    id: string;
    name: string;
    cre_id: string;
    location: Location;
    brand?: string;
    prices: GasPrices;
    image?: string;
    rating?: string;
    reviews?: number;
}

export interface APIResponse {
    lastUpdated: string;
    stations: Station[];
}
