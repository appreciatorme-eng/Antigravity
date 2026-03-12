import type { Activity, Day } from "./types";

export function isValidTime(value?: string) {
    return !!value && /^\d{2}:\d{2}$/.test(value);
}

export function timeToMinutes(value: string) {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
}

export function minutesToTime(totalMinutes: number) {
    const clamped = Math.max(0, Math.min(totalMinutes, (24 * 60) - 30));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function roundToNearestThirty(totalMinutes: number) {
    return Math.round(totalMinutes / 30) * 30;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return earthRadiusKm * c;
}

export function estimateTravelMinutes(previous?: Activity, current?: Activity) {
    if (!previous || !current) return 0;
    if (previous.location && current.location && previous.location.trim() === current.location.trim()) {
        return 0;
    }

    if (previous.coordinates && current.coordinates) {
        const distanceKm = haversineKm(previous.coordinates, current.coordinates);
        const averageCitySpeedKmh = 28;
        const driveMinutes = (distanceKm / averageCitySpeedKmh) * 60;
        const buffered = Math.round(driveMinutes + 10); // buffer for parking/transfers
        return Math.max(10, Math.min(buffered, 180));
    }

    // Fallback when coordinates are not available yet
    return 20;
}

export function inferExploreDurationMinutes(activity: Activity) {
    const text = `${activity.title || ""} ${activity.location || ""}`.toLowerCase();
    if (!text.trim()) return 90;

    if (/(flight|airport|transfer|pickup|drop)/.test(text)) return 45;
    if (/(walk|market|bazaar|street)/.test(text)) return 120;
    if (/(museum|fort|palace|temple|tomb|mosque|cathedral|monument|heritage)/.test(text)) return 90;
    if (/(meal|lunch|dinner|breakfast|food|restaurant|cafe|tea)/.test(text)) return 60;
    if (/(sunset|sunrise|golden hour|viewpoint|photo)/.test(text)) return 60;
    if (/(shopping)/.test(text)) return 90;

    return 75;
}

export function enrichDayDurations(day: Day): Day {
    return {
        ...day,
        activities: day.activities.map((activity) => ({
            ...activity,
            duration_minutes: (() => {
                const duration = Number(activity.duration_minutes) || 0;
                if (duration > 0 && duration !== 60) return duration;
                return inferExploreDurationMinutes(activity);
            })(),
        })),
    };
}

function optimizeActivitiesForRoute(activities: Activity[]) {
    if (activities.length <= 2) return activities;

    const anchor = activities[0];
    const remaining = activities.slice(1);
    const withCoordinates = remaining.filter((activity) => !!activity.coordinates);
    const withoutCoordinates = remaining.filter((activity) => !activity.coordinates);

    if (withCoordinates.length <= 1) {
        return activities;
    }

    const orderedByRoute: Activity[] = [];
    const unvisited = [...withCoordinates];

    let currentPoint = anchor.coordinates ?? unvisited[0]?.coordinates;
    if (!currentPoint) return activities;

    while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        for (let i = 0; i < unvisited.length; i++) {
            const candidate = unvisited[i];
            if (!candidate.coordinates) continue;
            const distance = haversineKm(currentPoint, candidate.coordinates);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        const [next] = unvisited.splice(nearestIndex, 1);
        orderedByRoute.push(next);
        if (next.coordinates) {
            currentPoint = next.coordinates;
        }
    }

    const routeDistanceKm = (route: Activity[]) => {
        if (route.length <= 1) return 0;

        let total = 0;
        if (anchor.coordinates && route[0]?.coordinates) {
            total += haversineKm(anchor.coordinates, route[0].coordinates);
        }

        for (let i = 1; i < route.length; i++) {
            const prev = route[i - 1].coordinates;
            const current = route[i].coordinates;
            if (prev && current) {
                total += haversineKm(prev, current);
            }
        }

        return total;
    };

    // 2-opt improvement pass for a better shortest-path approximation.
    const improvedRoute = [...orderedByRoute];
    if (improvedRoute.length >= 4) {
        let improved = true;
        while (improved) {
            improved = false;
            for (let i = 0; i < improvedRoute.length - 2; i++) {
                for (let k = i + 1; k < improvedRoute.length - 1; k++) {
                    const candidate = [
                        ...improvedRoute.slice(0, i),
                        ...improvedRoute.slice(i, k + 1).reverse(),
                        ...improvedRoute.slice(k + 1),
                    ];
                    if (routeDistanceKm(candidate) + 0.001 < routeDistanceKm(improvedRoute)) {
                        improvedRoute.splice(0, improvedRoute.length, ...candidate);
                        improved = true;
                    }
                }
            }
        }
    }

    return [anchor, ...improvedRoute, ...withoutCoordinates];
}

export function buildDaySchedule(day: Day): Day {
    const optimizedActivities = optimizeActivitiesForRoute(day.activities);
    const firstStart = isValidTime(optimizedActivities[0]?.start_time) ? optimizedActivities[0]!.start_time! : "09:00";
    const dayEnd = (24 * 60) - 30;
    let cursor = Math.max(0, Math.min(roundToNearestThirty(timeToMinutes(firstStart)), dayEnd));

    const activities = optimizedActivities.map((activity, index) => {
        const travelMinutes = index > 0 ? estimateTravelMinutes(optimizedActivities[index - 1], activity) : 0;
        const proposedStart = index === 0
            ? (isValidTime(activity.start_time) ? timeToMinutes(activity.start_time!) : cursor)
            : cursor + travelMinutes;
        const roundedStart = roundToNearestThirty(proposedStart);
        const startMinutes = Math.max(cursor, Math.min(roundedStart, dayEnd));
        const suggestedDuration = inferExploreDurationMinutes(activity);
        const duration = Math.max(30, Number(activity.duration_minutes) || suggestedDuration);
        let endMinutes = roundToNearestThirty(startMinutes + duration);
        if (endMinutes <= startMinutes) {
            endMinutes = startMinutes + 30;
        }
        endMinutes = Math.min(endMinutes, dayEnd);
        cursor = endMinutes;

        return {
            ...activity,
            start_time: minutesToTime(startMinutes),
            end_time: minutesToTime(endMinutes),
            duration_minutes: duration,
        };
    });

    return {
        ...day,
        activities,
    };
}

export function formatDate(dateString: string) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
