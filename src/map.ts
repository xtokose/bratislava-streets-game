import { importLibrary } from "@googlemaps/js-api-loader";
import {
    openStreetModal,
    closeStreetModal,
    showAnswerMessage
} from "./ui";

import {
    BRATISLAVA_CENTER,
    DEFAULT_ZOOM,
    MAP_STYLES
} from "./config";
import type { GameArea } from "./gameAreas";

const guessedStreetNames: Set<string> = new Set();
let allStreetFeatures: any[] = [];
let map: google.maps.Map;

const streetFeatures = new Map<string, google.maps.Data.Feature[]>();
let hoveredStreetName: string | null = null;

interface GameStats {
    guessed: number;
    total: number;
}


export async function initializeMap(): Promise<void> {
    const { Map: GoogleMap } =
        await google.maps.importLibrary(
            "maps"
        ) as google.maps.MapsLibrary;

    const mapElement =
        document.querySelector<HTMLDivElement>("#map");

    if (!mapElement) {
        throw new Error("Element #map nebol nájdený.");
    }

    map = new GoogleMap(mapElement, {
        center: {
            lat: 48.1486,
            lng: 17.1077
        },
        zoom: 12,

        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,

        styles: MAP_STYLES
    });

    /*
        Tento štýl sa použije aj na ulice,
        ktoré sa načítajú neskôr.
    */
    updateStreetStyles();

    // HOVER – kurzor vojde na ulicu
    map.data.addListener(
        "mouseover",
        (
            event: google.maps.Data.MouseEvent
        ): void => {
            const streetName =
                event.feature.getProperty("name");

            if (typeof streetName !== "string") {
                return;
            }

            setStreetHover(streetName, true);
        }
    );

    // HOVER – kurzor odíde z ulice
    map.data.addListener(
        "mouseout",
        (
            event: google.maps.Data.MouseEvent
        ): void => {
            const streetName =
                event.feature.getProperty("name");

            if (typeof streetName !== "string") {
                return;
            }

            setStreetHover(streetName, false);
        }
    );

    // KLIKNUTIE NA ULICU
    map.data.addListener(
        "click",
        (
            event: google.maps.Data.MouseEvent
        ): void => {
            const streetName =
                event.feature.getProperty("name");

            if (typeof streetName !== "string") {
                return;
            }

            openStreetModal(
                (answer: string): void => {
                    const normalizedAnswer =
                        normalizeStreetName(answer);

                    const normalizedStreetName =
                        normalizeStreetName(streetName);

                    if (normalizedAnswer === normalizedStreetName) {
                        const wasAlreadyGuessed =
                            guessedStreetNames.has(streetName);

                        guessedStreetNames.add(streetName);

                        const features =
                            streetFeatures.get(streetName);

                        features?.forEach((feature) => {
                            map.data.revertStyle(feature);
                        });

                        updateStreetStyles();

                        if (!wasAlreadyGuessed) {
                            updateGameStats();
                        }

                        closeStreetModal();
                    } else {
                        showAnswerMessage(
                            "Nesprávne. Skús to znova.",
                            false
                        );
                    }
                }
            );
        }
    );
}

function normalizeStreetName(name: string): string {
    return name
        .toLocaleLowerCase("sk")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}





export async function startGameForArea(
    area: GameArea
): Promise<void> {
    /*
        Najprv úspešne načítame nový súbor.
        Staré ulice zatiaľ zostávajú na mape.
    */
    const response = await fetch(
        area.geoJsonFile,
        {
            cache: "no-store"
        }
    );

    if (!response.ok) {
        throw new Error(
            `Súbor ${area.geoJsonFile} sa nepodarilo načítať. ` +
            `HTTP chyba: ${response.status}`
        );
    }

    const geoJson: object =
        await response.json();

    /*
        Staré ulice odstránime až po úspešnom
        načítaní nového súboru.
    */
    clearMapData();

    const loadedFeatures =
        map.data.addGeoJson(geoJson);

    guessedStreetNames.clear();

    groupStreetFeatures(loadedFeatures);
    updateStreetStyles();
    updateGameStats();
    fitMapToFeatures(loadedFeatures);

    console.log(
        `Načítaná oblasť: ${area.name}`
    );

    console.log(
        `Počet segmentov: ${loadedFeatures.length}`
    );

    console.log(
        `Počet rôznych ulíc: ${streetFeatures.size}`
    );
}

function clearMapData(): void {
    const featuresToRemove:
        google.maps.Data.Feature[] = [];

    map.data.forEach((feature) => {
        featuresToRemove.push(feature);
    });

    featuresToRemove.forEach((feature) => {
        map.data.remove(feature);
    });

    streetFeatures.clear();
}

function groupStreetFeatures(
    features: google.maps.Data.Feature[]
): void {
    streetFeatures.clear();

    for (const feature of features) {
        const streetName =
            feature.getProperty("name");

        if (
            typeof streetName !== "string" ||
            streetName.trim() === ""
        ) {
            continue;
        }

        const existingFeatures =
            streetFeatures.get(streetName);

        if (existingFeatures) {
            existingFeatures.push(feature);
        } else {
            streetFeatures.set(
                streetName,
                [feature]
            );
        }
    }
}

function fitMapToFeatures(
    features: google.maps.Data.Feature[]
): void {
    const bounds =
        new google.maps.LatLngBounds();

    for (const feature of features) {
        const geometry =
            feature.getGeometry();

        if (!geometry) {
            continue;
        }

        geometry.forEachLatLng((position) => {
            bounds.extend(position);
        });
    }

    if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
    }
}

function updateStreetStyles(): void {
    map.data.setStyle((feature) => {
        const streetName =
            feature.getProperty("name");

        if (typeof streetName !== "string") {
            return {
                visible: false
            };
        }

        if (guessedStreetNames.has(streetName)) {
            return {
                strokeColor: "#18a558",
                strokeWeight: 6,
                strokeOpacity: 1,
                clickable: true,
                zIndex: 10
            };
        }

        return {
            strokeColor: "#444444",
            strokeWeight: 5,
            strokeOpacity: 0.35,
            clickable: true,
            zIndex: 1
        };
    });
}


function setStreetHover(
    streetName: string,
    isHovered: boolean
): void {
    if (guessedStreetNames.has(streetName)) {
        return;
    }

    const features =
        streetFeatures.get(streetName);

    if (!features) {
        console.warn(
            `Ulica ${streetName} nie je v streetFeatures.`
        );

        return;
    }

    for (const feature of features) {
        if (isHovered) {
            map.data.overrideStyle(feature, {
                strokeColor: "#f5b700",
                strokeWeight: 8,
                strokeOpacity: 1,
                zIndex: 100
            });
        } else {
            map.data.revertStyle(feature);
        }
    }
}

function updateGameStats(): void {
    const stats: GameStats = {
        guessed: guessedStreetNames.size,
        total: streetFeatures.size
    };

    window.dispatchEvent(
        new CustomEvent<GameStats>(
            "game-stats-changed",
            {
                detail: stats
            }
        )
    );
}