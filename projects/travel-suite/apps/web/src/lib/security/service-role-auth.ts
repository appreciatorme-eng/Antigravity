import { safeEqual } from "./safe-equal";

export function isServiceRoleBearer(authHeader: string | null): boolean {
    if (!authHeader?.startsWith("Bearer ")) return false;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
    if (!serviceRole) return false;
    return safeEqual(authHeader.substring(7), serviceRole);
}
