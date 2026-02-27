import { test, expect } from "@playwright/test";
import { test as authTest } from "../fixtures/auth";

test.describe("Invoices API - Unauthenticated", () => {
  test("blocks invoice list", async ({ request }) => {
    const response = await request.get("/api/invoices");
    expect(response.status()).toBe(401);
  });

  test("blocks invoice creation", async ({ request }) => {
    const response = await request.post("/api/invoices", {
      data: {
        currency: "INR",
        items: [{ description: "Package", quantity: 1, unit_price: 1000, tax_rate: 18 }],
      },
    });
    expect(response.status()).toBe(401);
  });
});

authTest.describe("Invoices API - AuthZ and lifecycle", () => {
  authTest("forbids non-admin invoice list access", async ({ clientPage }) => {
    const response = await clientPage.request.get("/api/invoices");
    expect(response.status()).toBe(403);
  });

  authTest("rejects invalid invoice payload for admins", async ({ adminPage }) => {
    const response = await adminPage.request.post("/api/invoices", {
      data: {
        currency: "INR",
        items: [],
      },
    });
    expect(response.status()).toBe(400);
  });

  authTest("creates invoice with org snapshot and fetches detail", async ({ adminPage }) => {
    const createRes = await adminPage.request.post("/api/invoices", {
      data: {
        currency: "INR",
        due_date: "2026-03-20",
        notes: "E2E invoice creation test",
        items: [
          { description: "Kerala package planning", quantity: 2, unit_price: 12500, tax_rate: 18 },
          { description: "Airport transfer", quantity: 1, unit_price: 2500, tax_rate: 5 },
        ],
      },
    });

    expect(createRes.status(), await createRes.text()).toBe(201);
    const createdPayload = await createRes.json();
    const invoice = createdPayload.invoice;
    expect(invoice).toBeTruthy();
    expect(invoice.id).toBeTruthy();
    expect(invoice.invoice_number).toMatch(/^INV-\d{6}-\d{4,}$/);
    expect(Array.isArray(invoice.line_items)).toBeTruthy();
    expect(invoice.line_items.length).toBe(2);
    expect(invoice.organization_snapshot?.name).toBeTruthy();

    const detailRes = await adminPage.request.get(`/api/invoices/${invoice.id}`);
    expect(detailRes.status(), await detailRes.text()).toBe(200);
    const detailPayload = await detailRes.json();
    expect(detailPayload.invoice.id).toBe(invoice.id);
    expect(detailPayload.invoice.organization_snapshot?.name).toBeTruthy();
    expect(detailPayload.invoice.line_items.length).toBe(2);

    const deleteRes = await adminPage.request.delete(`/api/invoices/${invoice.id}`);
    expect(deleteRes.status(), await deleteRes.text()).toBe(200);
  });
});

