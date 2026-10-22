// Small extras on top of the static page. The page works without any of this.
//
// - "Updated ..." on each card, from the last push to that game's GitHub repo.
// - A card for any public repo with GitHub Pages turned on that isn't on the page yet, so a newly published game
//   shows up here by itself (with a placeholder cover until it gets a proper card in index.html).
// - The "Surprise me" button.

const GITHUB_USER = "DemiDummy";
const SITE_REPO = "demidummy.github.io";
const CACHE_KEY = "demidummy-repos";
const CACHE_MINUTES = 10;
const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const NEW_GAME_ACCENTS = [
    ["#ffb454", "#3a1f00"],
    ["#c39bff", "#21004a"],
    ["#5ee6a8", "#00301c"],
    ["#ff7a6b", "#3a0700"],
];

function describeAge(isoDate) {
    const days = Math.floor((Date.now() - Date.parse(isoDate)) / 86400000);
    if (days <= 0) return "Updated today";
    if (days === 1) return "Updated yesterday";
    if (days < 14) return `Updated ${days} days ago`;
    if (days < 60) return `Updated ${Math.round(days / 7)} weeks ago`;
    const months = Math.round(days / 30);
    if (months < 12) return `Updated ${months} months ago`;
    const date = new Date(isoDate).toLocaleDateString(undefined, { year: "numeric", month: "short" });
    return `Updated ${date}`;
}

async function loadRepos() {
    try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null");
        if (cached && Date.now() - cached.savedAt < CACHE_MINUTES * 60000) return cached.repos;
    } catch {
        // No storage (private window, blocked site data): just fetch.
    }

    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`);
    if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
    const repos = await response.json();

    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), repos }));
    } catch {
        // Not cached; fine.
    }
    return repos;
}

function knownRepoNames() {
    const names = new Set();
    for (const element of document.querySelectorAll("[data-repo]")) {
        names.add(element.dataset.repo.toLowerCase());
    }
    return names;
}

function showUpdatedDates(repos) {
    const pushedByName = new Map();
    for (const repo of repos) {
        pushedByName.set(repo.name.toLowerCase(), repo.pushed_at);
    }
    for (const element of document.querySelectorAll(".updated[data-repo]")) {
        const pushed = pushedByName.get(element.dataset.repo.toLowerCase());
        if (pushed) element.textContent = describeAge(pushed);
    }
}

/** "Pirate Web: sail, fight... Play it at https://..." becomes a title and a blurb. */
function splitDescription(repo) {
    const fallbackTitle = repo.name
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    let text = (repo.description ?? "").replace(/\s*Play( it)?( at|:)?\s*https?:\/\/\S+\s*$/i, "").trim();
    let title = fallbackTitle;

    const colon = text.indexOf(":");
    if (colon > 0 && colon <= 40) {
        title = text.slice(0, colon).trim();
        text = text.slice(colon + 1).trim();
    }
    if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1);
    return { title, blurb: text };
}

function initials(title) {
    const words = title.split(/\s+/).filter((word) => word.length > 0);
    let result = "";
    for (const word of words.slice(0, 2)) result += word.charAt(0).toUpperCase();
    return result;
}

function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
}

function buildNewGameCard(repo, index) {
    const { title, blurb } = splitDescription(repo);
    const [accent, accentInk] = NEW_GAME_ACCENTS[index % NEW_GAME_ACCENTS.length];
    const url = repo.homepage || `https://${SITE_REPO}/${repo.name}/`;

    const card = makeElement("li", "card");
    card.style.setProperty("--accent", accent);
    card.style.setProperty("--accent-ink", accentInk);

    const cover = makeElement("div", "cover placeholder", initials(title));
    cover.setAttribute("aria-hidden", "true");
    card.append(cover, makeElement("span", "new-badge", "New"));

    const body = makeElement("div", "body");
    body.append(makeElement("p", "genre", "Just published"));

    const heading = makeElement("h2");
    const link = makeElement("a", "stretch", title);
    link.href = url;
    heading.append(link);
    body.append(heading);

    if (blurb) body.append(makeElement("p", "blurb", blurb));

    const foot = makeElement("div", "foot");
    const updated = makeElement("span", "updated", describeAge(repo.pushed_at));
    updated.dataset.repo = repo.name;
    const play = makeElement("span", "play", "Play ");
    play.setAttribute("aria-hidden", "true");
    const svgNs = "http://www.w3.org/2000/svg";
    const icon = document.createElementNS(svgNs, "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    const triangle = document.createElementNS(svgNs, "path");
    triangle.setAttribute("d", "M8 5l11 7-11 7z");
    icon.append(triangle);
    play.append(icon);
    foot.append(updated, play);
    body.append(foot);

    card.append(body);
    return card;
}

function addNewGames(repos) {
    const known = knownRepoNames();
    const grid = document.getElementById("games");
    let added = 0;
    for (const repo of repos) {
        const name = repo.name.toLowerCase();
        if (!repo.has_pages || repo.fork || repo.archived || repo.private) continue;
        if (name === SITE_REPO || known.has(name)) continue;
        grid.prepend(buildNewGameCard(repo, added));
        added++;
    }
    return added;
}

function updateGameCount() {
    const count = document.querySelectorAll("#games .card").length;
    const label = document.getElementById("game-count");
    if (label) label.textContent = NUMBER_WORDS[count] ?? String(count);
}

function setUpSurpriseButton() {
    const button = document.getElementById("surprise");
    if (!button) return;
    button.addEventListener("click", () => {
        const links = document.querySelectorAll("#games .stretch");
        if (links.length === 0) return;
        const pick = links[Math.floor(Math.random() * links.length)];
        window.location.href = pick.href;
    });
}

async function enhance() {
    setUpSurpriseButton();
    try {
        const repos = await loadRepos();
        showUpdatedDates(repos);
        if (addNewGames(repos) > 0) updateGameCount();
    } catch (error) {
        // Offline or rate-limited: the cards just go without dates.
        console.info("Couldn't reach GitHub for game dates:", error);
    }
}

enhance();
