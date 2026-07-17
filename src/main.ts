import "./style.css";
import { setOptions } from "@googlemaps/js-api-loader";
import {
    initializeMap,
    startGameForArea
} from "./map";
import { initializeModal} from "./ui";
import { gameAreas, type GameArea } from "./gameAreas";

interface GameStats {
    guessed: number;
    total: number;
}

function getElement<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);

    if (!element) {
        throw new Error(`Element ${selector} sa nenašiel.`);
    }

    return element;
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div id="game">
        <div id="sidebar">
            <h1>Bratislava Streets</h1>

            <p class="sidebar-title">
                Vyber mestskú časť
            </p>

            <div id="game-area-buttons"></div>

            <div id="selected-area">
                Zatiaľ nebola vybraná žiadna mestská časť.
            </div>
            

            <div id="game-stats">
                <div>
                    Uhádnuté ulice:
                    <strong id="guessed-streets-count">0</strong>
                </div>

                <div>
                    Všetky ulice:
                    <strong id="total-streets-count">0</strong>
                </div>
            </div>

            <button id="start-game-button" type="button" disabled>
                Spustiť hru
            </button>
        </div>

        <div id="map"></div>
    </div>
`;


window.addEventListener(
    "game-stats-changed",
    (event: Event): void => {
        const statsEvent =
            event as CustomEvent<GameStats>;

        guessedStreetsCountElement.textContent =
            statsEvent.detail.guessed.toString();

        totalStreetsCountElement.textContent =
            statsEvent.detail.total.toString();
    }
);


const gameAreaButtons =
    getElement<HTMLDivElement>("#game-area-buttons");

const selectedAreaElement =
    getElement<HTMLDivElement>("#selected-area");

const guessedStreetsCountElement =
    getElement<HTMLElement>("#guessed-streets-count");

const totalStreetsCountElement =
    getElement<HTMLElement>("#total-streets-count");

if (!gameAreaButtons || !selectedAreaElement) {
    throw new Error("Nepodarilo sa nájsť prvky sidebaru.");
}




function createGameAreaButtons(): void {
    gameAreas.forEach((area: GameArea) => {
        const button = document.createElement("button");

        button.type = "button";
        button.classList.add("game-area-button");
        button.dataset.areaId = area.id;
        button.textContent = area.name;

        button.addEventListener("click", () => {
            selectGameArea(area, button);
        });





        gameAreaButtons.appendChild(button);
    });
}

function selectGameArea(
    area: GameArea,
    selectedButton: HTMLButtonElement
): void {
    document
        .querySelectorAll<HTMLButtonElement>(".game-area-button")
        .forEach((button) => {
            button.classList.remove("active");
        });

    selectedButton.classList.add("active");

    selectedGameArea = area;

    selectedAreaElement.textContent =
        `Vybraná oblasť: ${area.name}`;

    startGameButton.disabled = false;
}

createGameAreaButtons();
const startGameButton =
    getElement<HTMLButtonElement>("#start-game-button");

let selectedGameArea: GameArea | null = null;

startGameButton.addEventListener(
    "click",
    async (): Promise<void> => {
        if (!selectedGameArea) {
            return;
        }

        startGameButton.disabled = true;
        startGameButton.textContent =
            "Načítavam...";

        try {
            await startGameForArea(
                selectedGameArea
            );

            startGameButton.textContent =
                `Spustené: ${selectedGameArea.name}`;
        } catch (error) {
            console.error(error);

            startGameButton.textContent =
                "Načítanie zlyhalo";

            startGameButton.disabled = false;
        }
    }
);







const apiKey: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (!apiKey) {
    throw new Error("Chýba Google Maps API kľúč v súbore .env.");
}

setOptions({
    key: apiKey,
    language: "sk",
    region: "SK",
    v: "weekly"
});
initializeMap().catch((error: unknown) => {
    console.error("Mapa sa nepodarila načítať:", error);
});





initializeModal();
const testModalButton = document.querySelector<HTMLButtonElement>("#test-modal-button");
if (!testModalButton) {
    throw new Error("Tlačidlo #test-modal-button nebolo nájdené.");
}




