export async function getWikiImage(query) {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&pithumbsize=1000&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data && data.query && data.query.pages) {
            const pages = Object.values(data.query.pages);
            if (pages.length > 0 && pages[0].thumbnail) {
                return pages[0].thumbnail.source;
            }
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function run() {
    console.log("Eiffel Tower Paris:", await getWikiImage("Eiffel Tower Paris"));
    console.log("Central Park New York:", await getWikiImage("Central Park New York"));
    console.log("Cafe de Flore Paris:", await getWikiImage("Cafe de Flore Paris"));
    console.log("Generic walk:", await getWikiImage("Morning walk in Rome"));
    console.log("Museum of Modern Art:", await getWikiImage("Museum of Modern Art New York City"));
}
run();
