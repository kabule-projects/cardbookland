function isBlockedBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("oppo") || ua.includes('miuibrowser') || ua.includes("micromessenger"); // || ua.includes("safari");
};

if (isBlockedBrowser()) {
    fetch("no-access.html")
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            document.head.innerHTML = doc.head.innerHTML;
            document.body.innerHTML = doc.body.innerHTML;
        });
}



const CARD_MANIFEST_VERSION = "v5";
let cardManifest = [];

function showMainContent() {
    getCardManifestFromStorage()
        .then(() => loadUserGallery())
        .catch(err => console.error("Error loading content:", err));
}

function showModal(modalId) {
    const backdrop = document.getElementById("modal-backdrop");
    const modal = document.getElementById(modalId);

    if (backdrop && modal) {
        backdrop.style.display = "block";
        modal.style.display = "flex";
        backdrop.onclick = () => hideModal(modalId, true);
    }
}

function hideModal(modalId, hideBackdrop) {
    const backdrop = document.getElementById("modal-backdrop");
    const modal = document.getElementById(modalId);
    const modalImg = document.getElementById("card-modal-image");

    if (backdrop && modal) {
        modal.style.display = "none";
    }
    if (hideBackdrop) {
        backdrop.style.display = "none";
        backdrop.onclick = null;
    }

    if (modalImg) {
        modalImg.onclick = null; // clean up overlay toggle
    }
}


function showCardModal(card) {
    const wrapper = document.querySelector(".card-modal-wrapper");
    wrapper.innerHTML = "";

    // Overlay content
    const overlay = document.createElement("div");

    overlay.id = "card-info-overlay";
    overlay.className = "card-info-overlay";
    overlay.style.display = "none";

    const baseContent = `
    <div class="card-info-text">
        <strong>${card.name}</strong>
        ${card.story
            .split("\n")
            .filter(line => line.trim() !== "")
            .map(line => {
                if (line.startsWith("[right]")) {
                    return `<p style="text-align:right;">${line.replace("[right]", "").trim()}</p>`;
                }
                return `<p>${line}</p>`;
            })
            .join("")
        }
    </div>`;

    const footerText = `
    <div class="card-info-footer">
        <div>画师：@${card.artist || "未知"}</div>
        ${card.scripter
            ? `<div>文案：@${card.scripter}</div>`
            : ""
        }
    </div>`;

    overlay.innerHTML = baseContent + footerText;
    overlay.style.display = "none";

    const toggleOverlay = () => {
        overlay.style.display = overlay.style.display === "none" ? "block" : "none";
    };

    let mediaElement;

    const rankColors = {
        N: "#ffffff",
        R: "#568aec",
        SR: "#7946e0",
        SSR: "#FFD700",
        SP: "#fb56a9"
    };

    const color = rankColors[card.rank] || "#fff";

    const showImage = () => {
        const img = document.createElement("img");
        img.id = "card-modal-image";
        img.src = card.imageUrl;
        img.alt = "Card";
        img.style.boxShadow = `0 0 25px ${color}`;
        img.className = "card-modal-img";
        img.onclick = toggleOverlay;
        mediaElement = img;
        wrapper.prepend(img);
    };

    if (card.rank === "SP") {
        const videoPath = `assets/videos/sp-${card.cardCode}.mp4`;
        const video = document.createElement("video");
        video.src = videoPath;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.style.boxShadow = `0 0 25px ${color}`;
        video.className = "card-modal-video";
        video.style.maxWidth = "100%";
        video.style.maxHeight = "100%";
        video.onclick = toggleOverlay;

        // Fallback if video file fails to load
        video.onerror = () => {
            console.warn(`Video not found for SP card ${card.cardCode}, falling back to image.`);
            video.remove();
            showImage();
        };

        mediaElement = video;
        wrapper.prepend(video);
    } else {
        showImage();
    }

    overlay.onclick = toggleOverlay;
    wrapper.appendChild(overlay);

    // Scroll card info text to top
    const infoText = overlay.querySelector(".card-info-text");
    if (infoText) infoText.scrollTop = 0;

    showModal("card-modal");
}

async function loadUserGallery() {
    const gallery = document.getElementById("user-gallery");
    gallery.innerHTML = "";

    try {
        const grouped = {};
        const characters = ["周深", "周浅", "周卡布", "周果子", "周可可", "周星星", "神秘嘉宾", ""];
        const rankOrder = { SP: 0, SSR: 1, SR: 2, R: 3, N: 4 };

        // Group cards by character and sort by rank
        characters.forEach(char => grouped[char] = []);
        cardManifest.forEach(card => {
            const group = grouped[card.character || ""];
            group.push(card);
        });
        Object.values(grouped).forEach(group => {
            group.sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank]);
        });

        // Render
        for (const char of characters) {
            const section = document.createElement("div");
            section.className = "character-section";

            const header = document.createElement("h3");
            header.style.fontSize = "1.2rem";
            header.style.display = "flex";
            header.style.alignItems = "center";
            header.style.justifyContent = "center";

            const toggleBtn = document.createElement("button");
            toggleBtn.textContent = "▼";
            toggleBtn.style.marginLeft = "0.5rem";
            toggleBtn.style.fontSize = "1rem";
            toggleBtn.style.cursor = "pointer";
            toggleBtn.style.border = "none";
            toggleBtn.style.background = "none";

            header.textContent = "";

            const cardGroup = grouped[char];

            if (char !== "") {
                const avatar = document.createElement("img");
                avatar.src = `./assets/avatars/${char}.png`;
                avatar.alt = `${char}徽章`;
                avatar.style.height = "2rem";
                avatar.style.marginRight = "0.5rem";
                avatar.style.objectFit = "cover";
                header.appendChild(avatar);
            }


            const cardContainer = document.createElement("div");
            cardContainer.className = "card-container";

            // Toggle logic for every section
            toggleBtn.onclick = () => {
                const visible = cardContainer.style.display !== "none";
                cardContainer.style.display = visible ? "none" : "flex";
                toggleBtn.textContent = visible ? "▶" : "▼";
            };

            const nameSpan = document.createElement("span");
            nameSpan.textContent = char === "" ? "趣味卡" : char;
            header.appendChild(nameSpan);
            header.appendChild(toggleBtn);

            cardGroup.forEach(card => {
                const img = document.createElement("img");
                img.loading = "lazy";

                const isN = !card.character?.trim();

                img.src = card.imageUrl;
                img.alt = `${card.character || "趣味卡"} (${card.rank})`;
                img.className = "card-preview";

                img.addEventListener("click", () => {
                    showCardModal(card);
                });

                cardContainer.appendChild(img);
            });            

            section.appendChild(header);
            section.appendChild(cardContainer);
            gallery.appendChild(section);
        }
    } catch (err) {
        console.error("Failed to load inventory:", err);
    }
}

function loadCardManifest() {
    return fetch("assets/cards.csv")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch cards.csv");
            }
            return response.text();
        })
        .then(csvText => {
            const parsed = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
            });

            cardManifest = parsed.data.map(card => ({
                cardCode: card.code,
                name: card.name,
                story: card.story,
                artist: card.artist,
                scripter: card.scripter,
                character: card.character,
                rank: card.rank,
                imageUrl: `assets/cards/${card.code}.PNG`
            }));


            localStorage.setItem("cardManifest", JSON.stringify(cardManifest));
            localStorage.setItem("cardManifestVersion", CARD_MANIFEST_VERSION);
        })
        .catch(err => {
            console.error("Failed to load card manifest from CSV:", err);
        });
}

function getCardManifestFromStorage() {
    const cachedVersion = localStorage.getItem("cardManifestVersion");
    if (cachedVersion === CARD_MANIFEST_VERSION) {
        const cached = localStorage.getItem("cardManifest");
        if (cached) {
            try {
                cardManifest = JSON.parse(cached);
                return Promise.resolve();
            } catch (e) {
                console.error("Error parsing cached manifest:", e);
                localStorage.removeItem("cardManifest");
            }
        }
    }
    return loadCardManifest();
}

document.addEventListener('DOMContentLoaded', () => {
    showMainContent();
    const cardModal = document.getElementById("card-modal");
    if (cardModal) {
        cardModal.addEventListener("click", (e) => {
            if (e.target === cardModal) {
                hideModal("card-modal", true);
            }
        });
    }

    // QR Code modal
    const qrBtn = document.getElementById('qr-btn');
    const qrModal = document.getElementById('qr-modal');
    const qrClose = document.getElementById('qr-close');

    if (qrBtn && qrModal && qrClose) {
        qrBtn.addEventListener('click', () => {
            qrModal.style.display = 'flex';
        });

        qrClose.addEventListener('click', () => {
            qrModal.style.display = 'none';
        });

        qrModal.addEventListener('click', (e) => {
            if (e.target === qrModal) {
                qrModal.style.display = 'none';
            }
        });
    }
});
