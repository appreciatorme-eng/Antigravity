// ---------------------------------------------------------------------------
// Pre-generated Destination Image Library
// ---------------------------------------------------------------------------
// Curated, royalty-free Unsplash images for popular Indian travel destinations.
// Eliminates API wait times and AI costs for common destinations by providing
// instant, high-quality stock backgrounds.
// ---------------------------------------------------------------------------

export interface DestinationImage {
    url: string; // Full-size Unsplash URL (1080px+)
    thumb: string; // Thumbnail URL (400px)
    destination: string;
    photographer: string;
    tags: string[];
}

// ---------------------------------------------------------------------------
// Helper: build consistent Unsplash URLs from a photo ID
// ---------------------------------------------------------------------------

function fullUrl(photoId: string): string {
    return `/unsplash-img/${photoId}?auto=format&fit=crop&w=1080&q=80`;
}

function thumbUrl(photoId: string): string {
    return `/unsplash-img/${photoId}?auto=format&fit=crop&w=400&q=60`;
}

function img(
    photoId: string,
    destination: string,
    photographer: string,
    tags: string[]
): DestinationImage {
    return {
        url: fullUrl(photoId),
        thumb: thumbUrl(photoId),
        destination,
        photographer,
        tags,
    };
}

// ---------------------------------------------------------------------------
// Destination Library
// ---------------------------------------------------------------------------

export const DESTINATION_LIBRARY: Record<string, DestinationImage[]> = {
    // ── International ────────────────────────────────────────────────────

    maldives: [
        img("photo-1514282401047-d79a71a590e8", "Maldives", "Ishan Seefromthesky", ["beach", "overwater", "tropical"]),
        img("photo-1573843981267-be1999ff37cd", "Maldives", "Shifaaz Shamoon", ["resort", "ocean", "luxury"]),
        img("photo-1590523277543-a94d2e4eb00b", "Maldives", "Rayyu Maldives", ["aerial", "island", "turquoise"]),
    ],

    dubai: [
        img("photo-1512453979798-5ea266f8880c", "Dubai", "David Rodrigo", ["skyline", "cityscape", "modern"]),
        img("photo-1518684079-3c830dcef090", "Dubai", "Christoph Schulz", ["burj-khalifa", "city", "night"]),
        img("photo-1580674684081-7617fbf3d745", "Dubai", "Grisha Bruev", ["desert", "dunes", "golden"]),
    ],

    bali: [
        img("photo-1537996194471-e657df975ab4", "Bali", "Sebas van Erp", ["temple", "ocean", "cliff"]),
        img("photo-1555400038-63f5ba517a47", "Bali", "Alfiano Sutianto", ["rice-terrace", "green", "landscape"]),
        img("photo-1573790387438-4da905039392", "Bali", "Darren Lawrence", ["tropical", "sunset", "beach"]),
    ],

    thailand: [
        img("photo-1528181304800-259b08848526", "Thailand", "Mathew Schwartz", ["temple", "golden", "culture"]),
        img("photo-1552465011-b4e21bf6e79a", "Thailand", "Evan Krause", ["beach", "island", "tropical"]),
        img("photo-1504214208698-ea1916a2195a", "Thailand", "Alejandro Cartagena", ["longtail-boat", "ocean", "limestone"]),
    ],

    bangkok: [
        img("photo-1528181304800-259b08848526", "Bangkok", "Mathew Schwartz", ["temple", "golden", "culture"]),
        img("photo-1508009603885-50cf7c579365", "Bangkok", "Florian Wehde", ["city", "street", "nightlife"]),
    ],

    phuket: [
        img("photo-1552465011-b4e21bf6e79a", "Phuket", "Evan Krause", ["beach", "island", "tropical"]),
        img("photo-1589394815804-964ed0be2eb5", "Phuket", "Sumit Chinchane", ["coastline", "sunset", "resort"]),
    ],

    singapore: [
        img("photo-1525625293386-3f8f99389edd", "Singapore", "Peter Nguyen", ["marina-bay", "skyline", "modern"]),
        img("photo-1496939376851-89342e90adcd", "Singapore", "Hu Chen", ["gardens", "futuristic", "night"]),
        img("photo-1565967511849-76a60a516170", "Singapore", "SwapnIl Dwivedi", ["city", "architecture", "urban"]),
    ],

    switzerland: [
        img("photo-1530122037265-a5f1f91d3b99", "Switzerland", "Rico Reinholds", ["alps", "mountain", "snow"]),
        img("photo-1527668752968-14dc70a27c95", "Switzerland", "Patrick Robert Doyle", ["lake", "scenic", "landscape"]),
        img("photo-1506905925346-21bda4d32df4", "Switzerland", "Sven Scheuermeier", ["village", "valley", "green"]),
    ],

    paris: [
        img("photo-1502602898657-3e91760cbb34", "Paris", "Chris Karidis", ["eiffel-tower", "sunset", "iconic"]),
        img("photo-1499856871958-5b9627545d1a", "Paris", "Anthony DELANOIX", ["city", "architecture", "romantic"]),
        img("photo-1522093007474-d86e9bf7ba6f", "Paris", "Pedro Lastra", ["seine", "bridge", "evening"]),
    ],

    japan: [
        img("photo-1493976040374-85c8e12f0c0e", "Japan", "Manuel Cosentino", ["mount-fuji", "landscape", "iconic"]),
        img("photo-1545569341-9eb8b30979d9", "Japan", "Su San Lee", ["cherry-blossom", "temple", "spring"]),
        img("photo-1528360983277-13d401cdc186", "Japan", "Jezael Melgoza", ["tokyo", "city", "night"]),
    ],

    mauritius: [
        img("photo-1518509562904-e7ef99cdcc86", "Mauritius", "Xavier Coiffic", ["beach", "tropical", "island"]),
        img("photo-1585271245822-c5cc1e09ed7e", "Mauritius", "Nev Vish", ["ocean", "resort", "turquoise"]),
    ],

    "sri lanka": [
        img("photo-1586613835680-db2a0508c412", "Sri Lanka", "Max Harlynking", ["beach", "palm", "tropical"]),
        img("photo-1580477667995-2b94f01c9516", "Sri Lanka", "Danushka Senadeera", ["tea-plantation", "green", "highland"]),
        img("photo-1588598198321-9735fd53e99c", "Sri Lanka", "Shalitha Dissanayaka", ["temple", "culture", "heritage"]),
    ],

    srilanka: [
        img("photo-1586613835680-db2a0508c412", "Sri Lanka", "Max Harlynking", ["beach", "palm", "tropical"]),
        img("photo-1580477667995-2b94f01c9516", "Sri Lanka", "Danushka Senadeera", ["tea-plantation", "green", "highland"]),
    ],

    vietnam: [
        img("photo-1528127269322-539152f5ae1b", "Vietnam", "Jack Young", ["ha-long-bay", "boat", "limestone"]),
        img("photo-1557750255-c76072a7aad1", "Vietnam", "Ammie Ngo", ["lantern", "hoi-an", "culture"]),
        img("photo-1583417319070-4a69db38a482", "Vietnam", "Tron Le", ["rice-field", "landscape", "green"]),
    ],

    turkey: [
        img("photo-1541432901042-2d8bd64b4a9b", "Turkey", "Daniela Cuevas", ["cappadocia", "balloon", "sunrise"]),
        img("photo-1524231757912-21f4fe3a7200", "Turkey", "Anna Berdnik", ["istanbul", "mosque", "skyline"]),
        img("photo-1570939274717-7eda259b50ed", "Turkey", "Olga Feydo", ["pamukkale", "terraces", "white"]),
    ],

    istanbul: [
        img("photo-1524231757912-21f4fe3a7200", "Istanbul", "Anna Berdnik", ["mosque", "skyline", "culture"]),
        img("photo-1527838832700-5059252407fa", "Istanbul", "Osman Koycu", ["bosphorus", "bridge", "city"]),
    ],

    cappadocia: [
        img("photo-1541432901042-2d8bd64b4a9b", "Cappadocia", "Daniela Cuevas", ["balloon", "sunrise", "landscape"]),
        img("photo-1570939274717-7eda259b50ed", "Cappadocia", "Olga Feydo", ["fairy-chimney", "rock", "unique"]),
    ],

    // ── Domestic India ───────────────────────────────────────────────────

    goa: [
        img("photo-1512343879784-a960bf40e7f2", "Goa", "Suvan Chowdhury", ["beach", "sunset", "tropical"]),
        img("photo-1587922546307-776227941871", "Goa", "Sayan Ghosh", ["church", "portuguese", "heritage"]),
        img("photo-1614082242765-7c98ca0f3df3", "Goa", "Priyank P", ["coastline", "palm", "resort"]),
    ],

    kashmir: [
        img("photo-1595815771614-ade9d652a65d", "Kashmir", "Syed Umer", ["dal-lake", "shikara", "mountain"]),
        img("photo-1587474260584-136574528ed5", "Kashmir", "Syed Bilal Javaid", ["valley", "snow", "scenic"]),
        img("photo-1597074866923-dc0589150234", "Kashmir", "Shahid Tanweer", ["houseboat", "lake", "peaceful"]),
    ],

    rajasthan: [
        img("photo-1477587458883-47145ed94245", "Rajasthan", "Annie Spratt", ["fort", "palace", "heritage"]),
        img("photo-1524492412937-b28074a5d7da", "Rajasthan", "Bharath Raj", ["jaipur", "pink-city", "architecture"]),
        img("photo-1599661046289-e31897846e41", "Rajasthan", "Aditya Siva", ["desert", "camel", "sand"]),
    ],

    jaipur: [
        img("photo-1524492412937-b28074a5d7da", "Jaipur", "Bharath Raj", ["hawa-mahal", "pink-city", "architecture"]),
        img("photo-1477587458883-47145ed94245", "Jaipur", "Annie Spratt", ["amber-fort", "palace", "heritage"]),
    ],

    udaipur: [
        img("photo-1602216056096-3b40cc0c9944", "Udaipur", "Shubham Sharma", ["lake-palace", "romantic", "heritage"]),
        img("photo-1585136917250-93ddfab2e3a7", "Udaipur", "Navneet Shanu", ["city-palace", "lake", "royal"]),
    ],

    kerala: [
        img("photo-1602216056096-3b40cc0c9944", "Kerala", "Shubham Sharma", ["backwater", "houseboat", "tropical"]),
        img("photo-1593693397690-362cb9666fc2", "Kerala", "Vinu T", ["tea-plantation", "green", "munnar"]),
        img("photo-1609340667452-7b41982e30b1", "Kerala", "Vishnu Jayan", ["beach", "coconut", "sunset"]),
    ],

    manali: [
        img("photo-1626621341517-bbf3d9990a23", "Manali", "Abhinav Siarhi", ["mountain", "snow", "adventure"]),
        img("photo-1585136917250-93ddfab2e3a7", "Manali", "Navneet Shanu", ["valley", "green", "scenic"]),
    ],

    shimla: [
        img("photo-1572428817192-8a1c491a662e", "Shimla", "Ankit Patel", ["hill-station", "colonial", "mountain"]),
        img("photo-1597074866923-dc0589150234", "Shimla", "Shahid Tanweer", ["snow", "pine", "winter"]),
    ],

    ladakh: [
        img("photo-1626015365107-4bbe769e6949", "Ladakh", "Prashant Kumar", ["pangong-lake", "blue", "mountain"]),
        img("photo-1589308078059-be1415eab4c3", "Ladakh", "Rahul Sapra", ["monastery", "desert", "remote"]),
        img("photo-1600001050396-f33ddb0c92a2", "Ladakh", "Sayan Nath", ["landscape", "road", "adventure"]),
    ],

    andaman: [
        img("photo-1507525428034-b723cf961d3e", "Andaman Islands", "Sean Oulashin", ["beach", "turquoise", "island"]),
        img("photo-1544550581-5f7ceaf7c1b9", "Andaman Islands", "Jeremy Bishop", ["underwater", "coral", "snorkeling"]),
    ],

    "andaman islands": [
        img("photo-1507525428034-b723cf961d3e", "Andaman Islands", "Sean Oulashin", ["beach", "turquoise", "island"]),
        img("photo-1544550581-5f7ceaf7c1b9", "Andaman Islands", "Jeremy Bishop", ["underwater", "coral", "snorkeling"]),
    ],

    varanasi: [
        img("photo-1561361058-c24cecae35ca", "Varanasi", "Prashant Kumar", ["ghats", "ganges", "spiritual"]),
        img("photo-1570168007204-dfb528c6958f", "Varanasi", "Navneet Shanu", ["aarti", "temple", "heritage"]),
        img("photo-1564804955922-4e40d8600483", "Varanasi", "Ravi Sharma", ["boat", "sunrise", "culture"]),
    ],

    rishikesh: [
        img("photo-1582510003544-4d00b7f74220", "Rishikesh", "Ravi Pinisetti", ["yoga", "mountains", "spiritual"]),
        img("photo-1588083949413-5e020ee12089", "Rishikesh", "Navneet Shanu", ["ganges", "bridge", "adventure"]),
    ],

    darjeeling: [
        img("photo-1622308644420-b20142bd945e", "Darjeeling", "Mohit Kumar", ["tea-garden", "mountain", "scenic"]),
        img("photo-1544735716-392fe2489ffa", "Darjeeling", "Annie Spratt", ["himalaya", "sunrise", "kangchenjunga"]),
    ],

    meghalaya: [
        img("photo-1598091383021-15ddea10925d", "Meghalaya", "Dibakar Roy", ["waterfall", "green", "nature"]),
        img("photo-1625046882830-8add5b19ee0f", "Meghalaya", "Rohit Ganguly", ["living-root-bridge", "forest", "unique"]),
    ],
};

// ---------------------------------------------------------------------------
// Alias map for alternate spellings and common search terms
// ---------------------------------------------------------------------------

const DESTINATION_ALIASES: Record<string, string> = {
    maldive: "maldives",
    male: "maldives",
    "lakshadweep": "maldives",
    "uae": "dubai",
    "abu dhabi": "dubai",
    indonesia: "bali",
    ubud: "bali",
    pattaya: "thailand",
    "koh samui": "thailand",
    "chiang mai": "thailand",
    sentosa: "singapore",
    swiss: "switzerland",
    zurich: "switzerland",
    interlaken: "switzerland",
    france: "paris",
    tokyo: "japan",
    kyoto: "japan",
    osaka: "japan",
    colombo: "sri lanka",
    "ella": "sri lanka",
    kandy: "sri lanka",
    hanoi: "vietnam",
    "ho chi minh": "vietnam",
    "da nang": "vietnam",
    antalya: "turkey",
    havelock: "andaman",
    "neil island": "andaman",
    "port blair": "andaman",
    benares: "varanasi",
    kashi: "varanasi",
    haridwar: "rishikesh",
    shillong: "meghalaya",
    cherrapunji: "meghalaya",
    leh: "ladakh",
    "leh ladakh": "ladakh",
    "leh-ladakh": "ladakh",
    alleppey: "kerala",
    alappuzha: "kerala",
    munnar: "kerala",
    kochi: "kerala",
    "cochin": "kerala",
    "jodhpur": "rajasthan",
    "jaisalmer": "rajasthan",
    "pushkar": "rajasthan",
    kullu: "manali",
    "kullu manali": "manali",
    solang: "manali",
    panaji: "goa",
    calangute: "goa",
    anjuna: "goa",
};

// ---------------------------------------------------------------------------
// Match destination from a free-text query
// ---------------------------------------------------------------------------

export function matchDestination(query: string): DestinationImage[] {
    if (!query) return [];

    const normalized = query.toLowerCase().trim();

    // 1. Direct key match
    if (DESTINATION_LIBRARY[normalized]) {
        return DESTINATION_LIBRARY[normalized];
    }

    // 2. Alias match
    if (DESTINATION_ALIASES[normalized]) {
        return DESTINATION_LIBRARY[DESTINATION_ALIASES[normalized]] ?? [];
    }

    // 3. Partial key match (e.g., "maldives 4n/5d" matches "maldives")
    for (const [key, images] of Object.entries(DESTINATION_LIBRARY)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return images;
        }
    }

    // 4. Partial alias match
    for (const [alias, destKey] of Object.entries(DESTINATION_ALIASES)) {
        if (normalized.includes(alias) || alias.includes(normalized)) {
            return DESTINATION_LIBRARY[destKey] ?? [];
        }
    }

    // 5. Tag match across all images
    const allImages = Object.values(DESTINATION_LIBRARY).flat();
    const tagMatches = allImages.filter((img) =>
        img.tags.some((tag) => normalized.includes(tag))
    );

    return tagMatches;
}

// ---------------------------------------------------------------------------
// Get all available destination names (for autocomplete / display)
// ---------------------------------------------------------------------------

export function getDestinationNames(): string[] {
    const seen = new Set<string>();
    for (const images of Object.values(DESTINATION_LIBRARY)) {
        for (const image of images) {
            seen.add(image.destination);
        }
    }
    return Array.from(seen).sort();
}
