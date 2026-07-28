/*
   Book Finder

   One search box over the Google Books volumes endpoint. Results are built as
   DOM nodes rather than concatenated HTML, so a title with a quote or an
   angle bracket in it cannot break the page.
*/

const API = "https://www.googleapis.com/books/v1/volumes";

// Google Books answers unauthenticated requests out of a shared pool that is
// usually already exhausted, so this project carries its own browser key. A
// browser key is public by nature: restrict it to this domain in the Google
// Cloud console rather than treating it as a secret.
const API_KEY = "AIzaSyCnH0CugPJAFwEvJzoMAebMlTkf5Y69Hq0";

const PAGE_SIZE = 20;

const el = {
    form: document.getElementById("form"),
    input: document.getElementById("q"),
    submit: document.getElementById("submit"),
    help: document.getElementById("help"),
    count: document.getElementById("count"),
    results: document.getElementById("results"),
    more: document.getElementById("more")
};

const HELP_DEFAULT = el.help.textContent;

let query = "";
let loaded = 0;
let total = 0;
let inFlight = null;

/* ---------- small DOM helpers ---------- */

function elem(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
}

function setHelp(message, tone) {
    el.help.textContent = message;
    if (tone) el.help.dataset.tone = tone; else delete el.help.dataset.tone;
}

/* ---------- states ---------- */

function showSkeletons(howMany) {
    for (let i = 0; i < howMany; i++) {
        const card = elem("div", "skeleton");
        card.append(
            elem("div", "skeleton__cover"),
            elem("div", "skeleton__line"),
            elem("div", "skeleton__line skeleton__line--short")
        );
        el.results.append(card);
    }
}

function showNote(head, body, isError) {
    const note = elem("div", isError ? "note note--error" : "note");
    note.append(elem("h2", "note__head", head), elem("p", "note__body", body));
    el.results.append(note);
}

/* ---------- one result ---------- */

function coverUrl(info) {
    const links = info.imageLinks;
    if (!links) return null;
    const raw = links.thumbnail || links.smallThumbnail;
    if (!raw) return null;
    // The API hands these back over http, with a curled page corner drawn on.
    return raw.replace(/^http:/, "https:").replace("&edge=curl", "").replace("zoom=1", "zoom=2");
}

function bookCard(item) {
    const info = item.volumeInfo || {};
    const href = info.infoLink || info.canonicalVolumeLink || "#";
    const card = elem("article", "book");

    const cover = elem("a", "book__cover");
    cover.href = href;
    cover.target = "_blank";
    cover.rel = "noopener";
    cover.tabIndex = -1;
    cover.setAttribute("aria-hidden", "true");

    const src = coverUrl(info);
    if (src) {
        const img = elem("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        // A dead thumbnail should land on a spine, not a broken image icon.
        img.addEventListener("error", function () {
            cover.replaceChildren(elem("div", "book__spine", info.title || "Untitled"));
        });
        cover.append(img);
    } else {
        cover.append(elem("div", "book__spine", info.title || "Untitled"));
    }

    const title = elem("h3", "book__title");
    const titleLink = elem("a", null, info.title || "Untitled");
    titleLink.href = href;
    titleLink.target = "_blank";
    titleLink.rel = "noopener";
    title.append(titleLink);

    card.append(cover, title);

    if (info.authors && info.authors.length) {
        card.append(elem("p", "book__authors", info.authors.join(", ")));
    }

    const bits = [];
    if (info.publisher) bits.push(info.publisher);
    if (info.publishedDate) bits.push(String(info.publishedDate).slice(0, 4));
    if (bits.length) card.append(elem("p", "book__meta", bits.join(", ")));

    if (info.categories && info.categories.length) {
        card.append(elem("span", "book__tag", info.categories[0]));
    }

    return card;
}

/* ---------- fetching ---------- */

function describeCount() {
    const verb = total === 1 ? "book matches" : "books match";
    return total.toLocaleString("en") + " " + verb + " “" + query + "”. Showing " + loaded + ".";
}

async function search(append) {
    if (inFlight) inFlight.abort();
    const controller = new AbortController();
    inFlight = controller;

    el.submit.disabled = true;
    el.more.disabled = true;
    if (!append) {
        clear(el.results);
        el.count.textContent = "";
        el.more.hidden = true;
        showSkeletons(PAGE_SIZE / 2);
    }

    const url = API + "?q=" + encodeURIComponent(query) +
        "&maxResults=" + PAGE_SIZE + "&startIndex=" + loaded + "&key=" + API_KEY;

    try {
        const response = await fetch(url, { signal: controller.signal });
        const data = await response.json();

        if (!response.ok) {
            const reason = data && data.error && data.error.message;
            throw new Error(reason || "The request came back with status " + response.status + ".");
        }

        if (!append) clear(el.results);

        const items = data.items || [];
        total = data.totalItems || 0;

        if (!items.length && !append) {
            el.count.textContent = "";
            showNote("Nothing matched that.",
                "Try fewer words, a different spelling, or search for the author instead.");
            return;
        }

        items.forEach(function (item) { el.results.append(bookCard(item)); });
        loaded += items.length;
        el.count.textContent = describeCount();
        // Broad queries report a huge total but stop serving long before it.
        el.more.hidden = items.length < PAGE_SIZE || loaded >= total;
        setHelp(HELP_DEFAULT);
    } catch (error) {
        if (error.name === "AbortError") return;
        if (!append) clear(el.results);
        el.count.textContent = "";
        showNote("Google Books did not answer.", error.message, true);
    } finally {
        if (inFlight === controller) inFlight = null;
        el.submit.disabled = false;
        el.more.disabled = false;
    }
}

/* ---------- events ---------- */

el.form.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = el.input.value.trim();
    if (!value) {
        setHelp("Type something to search for first.", "error");
        el.input.focus();
        return;
    }
    query = value;
    loaded = 0;
    total = 0;
    search(false);
});

el.more.addEventListener("click", function () { search(true); });

el.input.addEventListener("input", function () {
    if (el.help.dataset.tone) setHelp(HELP_DEFAULT);
});

showNote("Nothing searched yet.",
    "Start with a title, an author, or a subject you have been meaning to read about.");
