import { renderClientProfilePage } from "./client-profile-page-content";

export default async function ClientProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return renderClientProfilePage({ params });
}
