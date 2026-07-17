import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as turf from "@turf/turf";

const currentFile = fileURLToPath(import.meta.url);
const scriptsDirectory = path.dirname(currentFile);
const projectDirectory = path.resolve(scriptsDirectory, "..");

const streetsFilePath = path.join(
    projectDirectory,
    "public",
    "bratislava-streets.geojson"
);

const areasDirectory = path.join(
    projectDirectory,
    "public",
    "areas"
);

const districtsBackupPath = path.join(
    projectDirectory,
    "public",
    "bratislava-districts.geojson"
);

/*
    Oficiálna vrstva hraníc mestských častí Bratislavy.

    outSR=4326 znamená, že hranice dostaneme
    v rovnakom súradnicovom systéme ako bežný GeoJSON:
    longitude, latitude.
*/
const districtsUrl =
    "https://services8.arcgis.com/pRlN1m0su5BYaFAS/" +
    "ArcGIS/rest/services/hranice/FeatureServer/1/query" +
    "?where=1%3D1" +
    "&outFields=*" +
    "&returnGeometry=true" +
    "&outSR=4326" +
    "&f=geojson";

const gameAreas = [
    {
        id: "stare-mesto",
        name: "Staré Mesto"
    },
    {
        id: "ruzinov",
        name: "Ružinov"
    },
    {
        id: "vrakuna",
        name: "Vrakuňa"
    },
    {
        id: "podunajske-biskupice",
        name: "Podunajské Biskupice"
    },
    {
        id: "nove-mesto",
        name: "Nové Mesto"
    },
    {
        id: "raca",
        name: "Rača"
    },
    {
        id: "vajnory",
        name: "Vajnory"
    },
    {
        id: "karlova-ves",
        name: "Karlova Ves"
    },
    {
        id: "dubravka",
        name: "Dúbravka"
    },
    {
        id: "lamac",
        name: "Lamač"
    },
    {
        id: "devin",
        name: "Devín"
    },
    {
        id: "devinska-nova-ves",
        name: "Devínska Nová Ves"
    },
    {
        id: "zahorska-bystrica",
        name: "Záhorská Bystrica"
    },
    {
        id: "petrzalka",
        name: "Petržalka"
    },
    {
        id: "jarovce",
        name: "Jarovce"
    },
    {
        id: "rusovce",
        name: "Rusovce"
    },
    {
        id: "cunovo",
        name: "Čunovo"
    }
];

function normalizeText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/^bratislava\s*[-–—]\s*/, "")
        .replace(/^mestska cast\s*/, "")
        .replace(/[^a-z0-9]/g, "");
}

function boundingBoxesOverlap(firstBox, secondBox) {
    const [
        firstWest,
        firstSouth,
        firstEast,
        firstNorth
    ] = firstBox;

    const [
        secondWest,
        secondSouth,
        secondEast,
        secondNorth
    ] = secondBox;

    return (
        firstWest <= secondEast &&
        firstEast >= secondWest &&
        firstSouth <= secondNorth &&
        firstNorth >= secondSouth
    );
}

function isStreetFeature(feature) {
    const geometryType = feature.geometry?.type;

    return (
        geometryType === "LineString" ||
        geometryType === "MultiLineString"
    );
}

function findGameArea(districtName) {
    let normalizedDistrictName =
        normalizeText(districtName);

    /*
        V zdrojových dátach je názov skrátený
        na "Podunajské Biskupic".
    */
    const districtNameAliases = {
        podunajskebiskupic:
            "podunajskebiskupice"
    };

    normalizedDistrictName =
        districtNameAliases[normalizedDistrictName] ??
        normalizedDistrictName;

    return gameAreas.find((area) => {
        const normalizedAreaName =
            normalizeText(area.name);

        return normalizedDistrictName === normalizedAreaName;
    });
}

async function readGeoJson(filePath) {
    const fileContent = await fs.readFile(
        filePath,
        "utf8"
    );

    const geoJson = JSON.parse(fileContent);

    if (
        geoJson.type !== "FeatureCollection" ||
        !Array.isArray(geoJson.features)
    ) {
        throw new Error(
            `Súbor ${filePath} nie je platný GeoJSON FeatureCollection.`
        );
    }

    return geoJson;
}

async function downloadDistricts() {
    console.log("Sťahujem hranice mestských častí...");

    const response = await fetch(districtsUrl);

    if (!response.ok) {
        throw new Error(
            "Hranice sa nepodarilo stiahnuť. " +
            `HTTP chyba: ${response.status}`
        );
    }

    const geoJson = await response.json();

    if (
        geoJson.type !== "FeatureCollection" ||
        !Array.isArray(geoJson.features)
    ) {
        throw new Error(
            "Stiahnuté hranice nemajú správny GeoJSON formát."
        );
    }

    return geoJson;
}

async function splitStreets() {
    console.log("Načítavam všetky ulice...");

    const streetsGeoJson =
        await readGeoJson(streetsFilePath);

    console.log(
        `Počet vstupných segmentov: ` +
        `${streetsGeoJson.features.length}`
    );

    const districtsGeoJson =
        await downloadDistricts();

    /*
        Hranice uložíme aj do public priečinka,
        aby sme ich mali ako zálohu.
    */
    await fs.writeFile(
        districtsBackupPath,
        JSON.stringify(districtsGeoJson),
        "utf8"
    );

    const districts = [];

    for (const districtFeature of districtsGeoJson.features) {
        const properties =
            districtFeature.properties ?? {};

        const districtName =
            properties.MC_LABEL ??
            properties.NAZOV_ZUJ;

        if (typeof districtName !== "string") {
            console.warn(
                "Hranica nemá názov:",
                properties
            );

            continue;
        }

        const gameArea =
            findGameArea(districtName);

        if (!gameArea) {
            console.warn(
                `Neznáma mestská časť: ${districtName}`
            );

            continue;
        }

        districts.push({
            area: gameArea,
            feature: districtFeature,
            boundingBox: turf.bbox(districtFeature)
        });
    }

    console.log(
        `Počet rozpoznaných mestských častí: ` +
        `${districts.length}`
    );

    const missingAreas = gameAreas.filter((area) => {
        return !districts.some((district) => {
            return district.area.id === area.id;
        });
    });

    if (missingAreas.length > 0) {
        const missingNames = missingAreas
            .map((area) => area.name)
            .join(", ");

        throw new Error(
            `Nenašli sa hranice oblastí: ${missingNames}`
        );
    }

    /*
        Pre každú mestskú časť vytvoríme
        samostatné pole ulíc.
    */
    const streetsByArea = new Map();

    for (const area of gameAreas) {
        streetsByArea.set(area.id, []);
    }

    let ignoredFeatures = 0;
    let unassignedFeatures = 0;

    for (const streetFeature of streetsGeoJson.features) {
        if (!isStreetFeature(streetFeature)) {
            ignoredFeatures++;
            continue;
        }

        const streetBoundingBox =
            turf.bbox(streetFeature);

        let wasAssigned = false;

        for (const district of districts) {
            if (
                !boundingBoxesOverlap(
                    streetBoundingBox,
                    district.boundingBox
                )
            ) {
                continue;
            }

            let intersects = false;

            try {
                intersects = turf.booleanIntersects(
                    streetFeature,
                    district.feature
                );
            } catch (error) {
                console.warn(
                    "Nepodarilo sa skontrolovať segment:",
                    streetFeature.properties?.name,
                    error
                );

                continue;
            }

            if (!intersects) {
                continue;
            }

            const areaStreets =
                streetsByArea.get(district.area.id);

            /*
                Skopírujeme ulicu a pridáme jej
                informáciu o mestskej časti.
            */
            areaStreets.push({
                ...streetFeature,

                properties: {
                    ...(streetFeature.properties ?? {}),

                    city_district:
                        district.area.name
                }
            });

            wasAssigned = true;
        }

        if (!wasAssigned) {
            unassignedFeatures++;
        }
    }

    /*
        Pri každom spustení odstránime staré výsledky
        a vytvoríme ich nanovo.
    */
    await fs.rm(areasDirectory, {
        recursive: true,
        force: true
    });

    await fs.mkdir(areasDirectory, {
        recursive: true
    });

    for (const area of gameAreas) {
        const areaFeatures =
            streetsByArea.get(area.id);

        const areaGeoJson = {
            type: "FeatureCollection",
            name: area.id,
            features: areaFeatures
        };

        const outputPath = path.join(
            areasDirectory,
            `${area.id}.geojson`
        );

        await fs.writeFile(
            outputPath,
            JSON.stringify(areaGeoJson),
            "utf8"
        );

        const uniqueStreetNames = new Set(
            areaFeatures
                .map((feature) => {
                    return feature.properties?.name;
                })
                .filter((name) => {
                    return typeof name === "string";
                })
        );

        console.log(
            `${area.name}: ` +
            `${areaFeatures.length} segmentov, ` +
            `${uniqueStreetNames.size} rôznych ulíc`
        );
    }

    console.log("");
    console.log(
        `Ignorované nečiarové objekty: ` +
        `${ignoredFeatures}`
    );

    console.log(
        `Nezaradené segmenty: ` +
        `${unassignedFeatures}`
    );

    console.log("");
    console.log(
        "Rozdelenie GeoJSON súborov bolo dokončené."
    );
}

splitStreets().catch((error) => {
    console.error("");
    console.error("Rozdelenie zlyhalo:");
    console.error(error);

    process.exitCode = 1;
});