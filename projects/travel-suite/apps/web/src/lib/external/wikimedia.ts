
export async function getWikimediaImage(query: string): Promise<string | null> {
    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=0&gsrlimit=1&gsrsearch=${encodeURIComponent(query)}&prop=pageimages&pithumbsize=800`;

        const res = await fetch(searchUrl);
        const data = await res.json();

        if (!data.query || !data.query.pages) return null;

        const pages = Object.values(data.query.pages);
        if (pages.length === 0) return null;

        const page: any = pages[0];
        return page.thumbnail ? page.thumbnail.source : null;
    } catch (error) {
        console.error("Wikimedia API Error:", error);
        return null;
    }
}
