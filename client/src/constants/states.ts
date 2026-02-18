export interface State {
    name: string;
    lat: number;
    lng: number;
}

export const MEXICAN_STATES: State[] = [
    { name: 'Aguascalientes', lat: 21.8853, lng: -102.2916 },
    { name: 'Baja California', lat: 32.6245, lng: -115.4523 }, // Mexicali
    { name: 'Baja California Sur', lat: 24.1426, lng: -110.3128 }, // La Paz
    { name: 'Campeche', lat: 19.8301, lng: -90.5349 },
    { name: 'Chiapas', lat: 16.7569, lng: -93.1292 }, // Tuxtla
    { name: 'Chihuahua', lat: 28.6353, lng: -106.089 },
    { name: 'Ciudad de México', lat: 19.4326, lng: -99.1332 },
    { name: 'Coahuila', lat: 25.4145, lng: -101.0029 }, // Saltillo
    { name: 'Colima', lat: 19.2452, lng: -103.724 },
    { name: 'Durango', lat: 24.0277, lng: -104.653 },
    { name: 'Guanajuato', lat: 21.0190, lng: -101.257 },
    { name: 'Guerrero', lat: 17.5510, lng: -99.5052 }, // Chilpancingo
    { name: 'Hidalgo', lat: 20.1011, lng: -98.7591 }, // Pachuca
    { name: 'Jalisco', lat: 20.6597, lng: -103.349 }, // Guadalajara
    { name: 'Estado de México', lat: 19.2826, lng: -99.6557 }, // Toluca
    { name: 'Michoacán', lat: 19.7007, lng: -101.1856 }, // Morelia
    { name: 'Morelos', lat: 18.9186, lng: -99.2184 }, // Cuernavaca
    { name: 'Nayarit', lat: 21.5042, lng: -104.8946 }, // Tepic
    { name: 'Nuevo León', lat: 25.6866, lng: -100.3161 }, // Monterrey
    { name: 'Oaxaca', lat: 17.0732, lng: -96.7266 },
    { name: 'Puebla', lat: 19.0414, lng: -98.2063 },
    { name: 'Querétaro', lat: 20.5888, lng: -100.3899 },
    { name: 'Quintana Roo', lat: 21.1619, lng: -86.8515 }, // Cancun (more robust than Chetumal)
    { name: 'San Luis Potosí', lat: 22.1565, lng: -100.9855 },
    { name: 'Sinaloa', lat: 24.8091, lng: -107.3940 }, // Culiacan
    { name: 'Sonora', lat: 29.0729, lng: -110.9559 }, // Hermosillo
    { name: 'Tabasco', lat: 17.9895, lng: -92.9281 }, // Villahermosa
    { name: 'Tamaulipas', lat: 23.7369, lng: -99.1411 }, // Ciudad Victoria
    { name: 'Tlaxcala', lat: 19.3139, lng: -98.2404 },
    { name: 'Veracruz', lat: 19.1738, lng: -96.1342 }, // Veracruz Port
    { name: 'Yucatán', lat: 20.9674, lng: -89.5926 }, // Merida
    { name: 'Zacatecas', lat: 22.7709, lng: -102.5830 }
];
