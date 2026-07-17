export interface GameArea {
    id: string;
    name: string;
    geoJsonFile: string;
}

const baseUrl = import.meta.env.BASE_URL;

export const gameAreas: GameArea[] = [
    {
        id: "cela-bratislava",
        name: "Celá Bratislava",
        geoJsonFile: `${baseUrl}bratislava-streets.geojson`
    },
    {
        id: "stare-mesto",
        name: "Staré Mesto",
        geoJsonFile: `${baseUrl}areas/stare-mesto.geojson`
    },
    {
        id: "ruzinov",
        name: "Ružinov",
        geoJsonFile: `${baseUrl}areas/ruzinov.geojson`
    },
    {
        id: "vrakuna",
        name: "Vrakuňa",
        geoJsonFile: `${baseUrl}areas/vrakuna.geojson`
    },
    {
        id: "podunajske-biskupice",
        name: "Podunajské Biskupice",
        geoJsonFile: `${baseUrl}areas/podunajske-biskupice.geojson`
    },
    {
        id: "nove-mesto",
        name: "Nové Mesto",
        geoJsonFile: `${baseUrl}areas/nove-mesto.geojson`
    },
    {
        id: "raca",
        name: "Rača",
        geoJsonFile: `${baseUrl}areas/raca.geojson`
    },
    {
        id: "vajnory",
        name: "Vajnory",
        geoJsonFile: `${baseUrl}areas/vajnory.geojson`
    },
    {
        id: "karlova-ves",
        name: "Karlova Ves",
        geoJsonFile: `${baseUrl}areas/karlova-ves.geojson`
    },
    {
        id: "dubravka",
        name: "Dúbravka",
        geoJsonFile: `${baseUrl}areas/dubravka.geojson`
    },
    {
        id: "lamac",
        name: "Lamač",
        geoJsonFile: `${baseUrl}areas/lamac.geojson`
    },
    {
        id: "devin",
        name: "Devín",
        geoJsonFile: `${baseUrl}areas/devin.geojson`
    },
    {
        id: "devinska-nova-ves",
        name: "Devínska Nová Ves",
        geoJsonFile: `${baseUrl}areas/devinska-nova-ves.geojson`
    },
    {
        id: "zahorska-bystrica",
        name: "Záhorská Bystrica",
        geoJsonFile: `${baseUrl}areas/zahorska-bystrica.geojson`
    },
    {
        id: "petrzalka",
        name: "Petržalka",
        geoJsonFile: `${baseUrl}areas/petrzalka.geojson`
    },
    {
        id: "jarovce",
        name: "Jarovce",
        geoJsonFile: `${baseUrl}areas/jarovce.geojson`
    },
    {
        id: "rusovce",
        name: "Rusovce",
        geoJsonFile: `${baseUrl}areas/rusovce.geojson`
    },
    {
        id: "cunovo",
        name: "Čunovo",
        geoJsonFile: `${baseUrl}areas/cunovo.geojson`
    }
];