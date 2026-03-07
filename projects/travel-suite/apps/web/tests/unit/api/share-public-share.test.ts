import { expect, it } from "vitest";

import {
  buildPublicShareResponse,
  parseCommentArray,
} from "../../../src/app/api/_handlers/share/[token]/public-share";

it("sanitizes comment arrays and drops invalid entries", () => {
  const comments = parseCommentArray([
    {
      id: "comment-1",
      author: "Priya",
      comment: "Need a faster itinerary",
      created_at: "2026-03-07T00:00:00.000Z",
    },
    {
      author: "Empty",
      comment: "",
    },
  ]);

  expect(comments).toEqual([
    {
      id: "comment-1",
      author: "Priya",
      comment: "Need a faster itinerary",
      created_at: "2026-03-07T00:00:00.000Z",
    },
  ]);
});

it("builds a public response without exposing email or phone data", () => {
  const response = buildPublicShareResponse({
    id: "share-1",
    itinerary_id: "iti-1",
    client_comments: [],
    expires_at: "2026-03-09T00:00:00.000Z",
    status: "viewed",
    approved_by: null,
    approved_at: null,
    client_preferences: {
      budget_preference: "premium",
      must_have: ["spa"],
    },
    wishlist_items: ["Sunset cruise"],
    self_service_status: "active",
    offline_pack_ready: true,
    email: "hidden@example.com",
    phone: "+15555550123",
  } as unknown as Parameters<typeof buildPublicShareResponse>[0]);

  expect(response).toMatchObject({
    status: "viewed",
    wishlist_items: ["Sunset cruise"],
    offline_pack_ready: true,
  });
  expect(response).not.toHaveProperty("email");
  expect(response).not.toHaveProperty("phone");
  expect(JSON.stringify(response)).not.toContain("hidden@example.com");
  expect(JSON.stringify(response)).not.toContain("+15555550123");
});
