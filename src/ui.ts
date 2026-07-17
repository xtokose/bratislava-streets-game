let modalElement: HTMLDivElement | null = null;
let streetInputElement: HTMLInputElement | null = null;
let submitCallback: ((answer: string) => void) | null = null;


export function initializeModal(): void {
    document.body.insertAdjacentHTML(
        "beforeend",
        `
        <div id="street-modal" class="modal hidden">
            <div class="modal-content">
                <button
                    id="close-modal-button"
                    class="close-button"
                    type="button"
                    aria-label="Zavrieť"
                >
                    ×
                </button>

                <h2>Zadaj názov ulice</h2>

                <p>
                    Aký je názov označenej ulice?
                </p>

                <form id="street-form">
                    <input
                        id="street-input"
                        type="text"
                        placeholder="Napríklad Obchodná"
                        autocomplete="off"
                    >

                    <button type="submit">
                        Potvrdiť
                    </button>
                </form>

                <p id="answer-message"></p>
            </div>
        </div>
        `
    );

    modalElement = document.querySelector<HTMLDivElement>("#street-modal");
    streetInputElement = document.querySelector<HTMLInputElement>("#street-input");
    const closeButton = document.querySelector<HTMLButtonElement>("#close-modal-button");
    const form = document.querySelector<HTMLFormElement>("#street-form");

    if (
        !modalElement ||
        !streetInputElement ||
        !closeButton ||
        !form
    ) {
        throw new Error("Niektorý element modálneho okna nebol nájdený.");
    }

    closeButton.addEventListener("click", closeStreetModal);
    modalElement.addEventListener("click", (event: MouseEvent) => {
        if (event.target === modalElement) {
            closeStreetModal();
        }
    });

    form.addEventListener("submit", (event: SubmitEvent) => {
        event.preventDefault();

        const answer: string = streetInputElement!.value.trim();

        if (answer === "") {
            return;
        }
        submitCallback?.(answer);
    });
}

function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
        closeStreetModal();
    }
}

export function openStreetModal(
    onSubmit: (answer: string) => void
): void {
    if (!modalElement || !streetInputElement) {
        throw new Error("Modálne okno ešte nebolo inicializované.");
    }


    submitCallback = onSubmit;
    document.addEventListener("keydown", handleKeyDown);

    modalElement.classList.remove("hidden");
    streetInputElement.value = "";

    const messageElement = document.querySelector<HTMLParagraphElement>("#answer-message");
    if (messageElement) {
        messageElement.textContent = "";
        messageElement.className = "";
    }
    streetInputElement.focus();
}

export function closeStreetModal(): void {
    const modalElement =
        document.querySelector<HTMLDivElement>("#street-modal");

    if (!modalElement) {
        return;
    }

    modalElement.classList.add("hidden");
}

export function showAnswerMessage(
    message: string,
    isCorrect: boolean
): void {
    const messageElement =
        document.querySelector<HTMLParagraphElement>(
            "#answer-message"
        );

    if (!messageElement) {
        throw new Error(
            "Element #answer-message nebol nájdený."
        );
    }

    messageElement.textContent = message;

    messageElement.classList.toggle(
        "correct-answer",
        isCorrect
    );

    messageElement.classList.toggle(
        "wrong-answer",
        !isCorrect
    );
}