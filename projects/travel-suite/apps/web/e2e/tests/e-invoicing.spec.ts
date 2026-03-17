import { test, expect } from "@playwright/test";
import { test as authTest } from "../fixtures/auth";

/**
 * E2E Test Suite: E-Invoicing Compliance
 *
 * Tests the complete e-invoicing workflow:
 * 1. Configure e-invoice settings with sandbox credentials
 * 2. Create invoice above threshold
 * 3. Verify IRN is generated and stored
 * 4. Verify e-invoice status is acknowledged
 * 5. Export GSTR-1 and verify invoice is included
 * 6. Test e-invoice cancellation
 */

const SANDBOX_CREDENTIALS = {
  gstin: "29AAFCD5862R000",
  irp_username: process.env.TEST_IRP_USERNAME || "sandbox_user",
  irp_password: process.env.TEST_IRP_PASSWORD || "sandbox_pass",
  irp_api_key: process.env.TEST_IRP_API_KEY || "sandbox_key",
  threshold_amount: 50000,
  auto_generate_enabled: true,
  sandbox_mode: true,
};

authTest.describe("E-Invoicing - Full Workflow", () => {
  authTest("configures e-invoice settings", async ({ adminPage }) => {
    // Step 1: Configure e-invoice settings via API
    const settingsResponse = await adminPage.request.post("/api/settings/e-invoicing", {
      data: SANDBOX_CREDENTIALS,
    });

    expect(settingsResponse.status(), await settingsResponse.text()).toBe(200);
    const settingsData = await settingsResponse.json();
    expect(settingsData.success).toBeTruthy();

    // Verify settings were saved by fetching them
    const getResponse = await adminPage.request.get("/api/settings/e-invoicing");
    expect(getResponse.status()).toBe(200);
    const savedSettings = await getResponse.json();

    expect(savedSettings.settings).toBeTruthy();
    expect(savedSettings.settings.gstin).toBe(SANDBOX_CREDENTIALS.gstin);
    expect(savedSettings.settings.threshold_amount).toBe(SANDBOX_CREDENTIALS.threshold_amount);
    expect(savedSettings.settings.auto_generate_enabled).toBe(true);
    expect(savedSettings.settings.sandbox_mode).toBe(true);
  });

  authTest("creates invoice above threshold and generates e-invoice", async ({ adminPage }) => {
    // Step 1: Configure e-invoice settings first
    await adminPage.request.post("/api/settings/e-invoicing", {
      data: SANDBOX_CREDENTIALS,
    });

    // Step 2: Create invoice above threshold (₹50,000)
    const createResponse = await adminPage.request.post("/api/invoices", {
      data: {
        currency: "INR",
        due_date: "2026-04-15",
        notes: "E2E e-invoicing test - above threshold",
        items: [
          {
            description: "Kerala Tour Package - Premium",
            quantity: 2,
            unit_price: 30000,
            tax_rate: 18,
          },
        ],
      },
    });

    expect(createResponse.status(), await createResponse.text()).toBe(201);
    const createData = await createResponse.json();
    const invoice = createData.invoice;

    expect(invoice).toBeTruthy();
    expect(invoice.id).toBeTruthy();
    expect(invoice.total_amount).toBeGreaterThan(SANDBOX_CREDENTIALS.threshold_amount);

    // Step 3: Verify IRN is generated (might be async, retry a few times)
    let invoiceWithIRN = null;
    let retries = 5;

    while (retries > 0) {
      await adminPage.waitForTimeout(2000); // Wait 2 seconds between retries

      const detailResponse = await adminPage.request.get(`/api/invoices/${invoice.id}`);
      expect(detailResponse.status()).toBe(200);
      const detailData = await detailResponse.json();

      if (detailData.invoice.irn) {
        invoiceWithIRN = detailData.invoice;
        break;
      }

      retries--;
    }

    // In sandbox mode, IRN might be auto-generated or we might need to trigger it manually
    // If auto-generation didn't work, manually trigger e-invoice generation
    if (!invoiceWithIRN?.irn) {
      const generateResponse = await adminPage.request.post("/api/admin/e-invoicing/generate", {
        data: {
          invoice_id: invoice.id,
          seller_details: {
            legal_name: "Test Travel Agency Pvt Ltd",
            address1: "123 MG Road",
            location: "Bangalore",
            pincode: 560001,
            state_code: "29",
          },
          buyer_details: {
            gstin: "27AAPFU0939F1ZV",
            legal_name: "Test Customer Corp",
            address1: "456 Commercial Street",
            location: "Mumbai",
            pincode: 400001,
            state_code: "27",
          },
        },
      });

      expect(generateResponse.status(), await generateResponse.text()).toBe(200);
      const generateData = await generateResponse.json();
      expect(generateData.irn).toBeTruthy();
      expect(generateData.e_invoice_status).toBeTruthy();

      // Fetch updated invoice
      const updatedResponse = await adminPage.request.get(`/api/invoices/${invoice.id}`);
      const updatedData = await updatedResponse.json();
      invoiceWithIRN = updatedData.invoice;
    }

    // Step 4: Verify IRN and e-invoice data
    expect(invoiceWithIRN.irn).toBeTruthy();
    expect(invoiceWithIRN.irn).toMatch(/^[A-Z0-9]{64}$/); // IRN is 64-char alphanumeric
    expect(invoiceWithIRN.e_invoice_status).toBeTruthy();
    expect(['generated', 'acknowledged']).toContain(invoiceWithIRN.e_invoice_status);
    expect(invoiceWithIRN.e_invoice_json).toBeTruthy();
    expect(invoiceWithIRN.qr_code_data).toBeTruthy();

    // Step 5: Verify QR code data format (pipe-delimited)
    const qrParts = invoiceWithIRN.qr_code_data.split('|');
    expect(qrParts.length).toBeGreaterThanOrEqual(10); // Government spec has multiple fields
    expect(qrParts[0]).toBe(SANDBOX_CREDENTIALS.gstin); // First field is seller GSTIN

    // Clean up: delete invoice
    await adminPage.request.delete(`/api/invoices/${invoice.id}`);
  });

  authTest("verifies e-invoice appears in GSTR-1 export", async ({ adminPage }) => {
    // Step 1: Configure e-invoice settings
    await adminPage.request.post("/api/settings/e-invoicing", {
      data: SANDBOX_CREDENTIALS,
    });

    // Step 2: Create invoice with e-invoice
    const createResponse = await adminPage.request.post("/api/invoices", {
      data: {
        currency: "INR",
        due_date: "2026-04-15",
        notes: "E2E GSTR-1 export test",
        items: [
          {
            description: "Rajasthan Heritage Tour",
            quantity: 1,
            unit_price: 75000,
            tax_rate: 18,
          },
        ],
      },
    });

    const createData = await createResponse.json();
    const invoice = createData.invoice;

    // Step 3: Generate e-invoice manually to ensure it's ready
    const generateResponse = await adminPage.request.post("/api/admin/e-invoicing/generate", {
      data: {
        invoice_id: invoice.id,
        seller_details: {
          legal_name: "Test Travel Agency Pvt Ltd",
          address1: "123 MG Road",
          location: "Bangalore",
          pincode: 560001,
          state_code: "29",
        },
        buyer_details: {
          gstin: "27AAPFU0939F1ZV",
          legal_name: "Test Customer Corp",
          address1: "456 Commercial Street",
          location: "Mumbai",
          pincode: 400001,
          state_code: "27",
        },
      },
    });

    expect(generateResponse.status(), await generateResponse.text()).toBe(200);
    const generateData = await generateResponse.json();
    expect(generateData.irn).toBeTruthy();

    // Step 4: Export GSTR-1 for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const gstrResponse = await adminPage.request.get(
      `/api/admin/reports/gstr-1?month=${currentMonth}&format=json`
    );

    expect(gstrResponse.status(), await gstrResponse.text()).toBe(200);
    const gstrData = await gstrResponse.json();

    expect(gstrData.data).toBeTruthy();
    expect(gstrData.data.gstin).toBe(SANDBOX_CREDENTIALS.gstin);
    expect(gstrData.data.period).toBe(currentMonth);

    // Step 5: Verify invoice is included in B2B section (has GSTIN)
    const b2bInvoices = gstrData.data.b2b || [];
    const foundInvoice = b2bInvoices.find((inv: any) =>
      inv.invoiceNumber === invoice.invoice_number
    );

    expect(foundInvoice).toBeTruthy();
    expect(foundInvoice.irn).toBe(generateData.irn);
    expect(foundInvoice.buyerGSTIN).toBe("27AAPFU0939F1ZV");

    // Step 6: Verify summary totals
    expect(gstrData.data.summary).toBeTruthy();
    expect(gstrData.data.summary.totalInvoices).toBeGreaterThan(0);
    expect(gstrData.data.summary.totalB2BInvoices).toBeGreaterThan(0);
    expect(gstrData.data.summary.totalTaxableValue).toBeGreaterThan(0);

    // Clean up
    await adminPage.request.delete(`/api/invoices/${invoice.id}`);
  });

  authTest("cancels e-invoice successfully", async ({ adminPage }) => {
    // Step 1: Configure e-invoice settings
    await adminPage.request.post("/api/settings/e-invoicing", {
      data: SANDBOX_CREDENTIALS,
    });

    // Step 2: Create invoice and generate e-invoice
    const createResponse = await adminPage.request.post("/api/invoices", {
      data: {
        currency: "INR",
        due_date: "2026-04-15",
        notes: "E2E e-invoice cancellation test",
        items: [
          {
            description: "Goa Beach Tour",
            quantity: 1,
            unit_price: 60000,
            tax_rate: 18,
          },
        ],
      },
    });

    const createData = await createResponse.json();
    const invoice = createData.invoice;

    // Generate e-invoice
    const generateResponse = await adminPage.request.post("/api/admin/e-invoicing/generate", {
      data: {
        invoice_id: invoice.id,
        seller_details: {
          legal_name: "Test Travel Agency Pvt Ltd",
          address1: "123 MG Road",
          location: "Bangalore",
          pincode: 560001,
          state_code: "29",
        },
        buyer_details: {
          gstin: "27AAPFU0939F1ZV",
          legal_name: "Test Customer Corp",
          address1: "456 Commercial Street",
          location: "Mumbai",
          pincode: 400001,
          state_code: "27",
        },
      },
    });

    expect(generateResponse.status()).toBe(200);
    const generateData = await generateResponse.json();
    const irn = generateData.irn;
    expect(irn).toBeTruthy();

    // Step 3: Cancel e-invoice
    const cancelResponse = await adminPage.request.post("/api/admin/e-invoicing/cancel", {
      data: {
        invoice_id: invoice.id,
        reason: "Duplicate",
        remarks: "E2E test cancellation - duplicate invoice created by mistake",
      },
    });

    expect(cancelResponse.status(), await cancelResponse.text()).toBe(200);
    const cancelData = await cancelResponse.json();
    expect(cancelData.success).toBeTruthy();
    expect(cancelData.status).toBe("cancelled");

    // Step 4: Verify status changed to cancelled
    const detailResponse = await adminPage.request.get(`/api/invoices/${invoice.id}`);
    const detailData = await detailResponse.json();

    expect(detailData.invoice.e_invoice_status).toBe("cancelled");
    expect(detailData.invoice.irn).toBe(irn); // IRN remains same

    // Step 5: Verify cancelled invoice is excluded from GSTR-1
    const currentMonth = new Date().toISOString().slice(0, 7);
    const gstrResponse = await adminPage.request.get(
      `/api/admin/reports/gstr-1?month=${currentMonth}&format=json`
    );

    const gstrData = await gstrResponse.json();
    const b2bInvoices = gstrData.data.b2b || [];
    const cancelledInvoice = b2bInvoices.find((inv: any) =>
      inv.invoiceNumber === invoice.invoice_number
    );

    // Cancelled invoices should be excluded from GSTR-1
    expect(cancelledInvoice).toBeUndefined();

    // Clean up
    await adminPage.request.delete(`/api/invoices/${invoice.id}`);
  });

  authTest("handles below-threshold invoice without e-invoice", async ({ adminPage }) => {
    // Step 1: Configure e-invoice settings with threshold
    await adminPage.request.post("/api/settings/e-invoicing", {
      data: SANDBOX_CREDENTIALS,
    });

    // Step 2: Create invoice BELOW threshold (₹50,000)
    const createResponse = await adminPage.request.post("/api/invoices", {
      data: {
        currency: "INR",
        due_date: "2026-04-15",
        notes: "E2E test - below threshold",
        items: [
          {
            description: "Local Day Tour",
            quantity: 1,
            unit_price: 3000,
            tax_rate: 18,
          },
        ],
      },
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    const invoice = createData.invoice;

    expect(invoice.total_amount).toBeLessThan(SANDBOX_CREDENTIALS.threshold_amount);

    // Step 3: Wait a bit to ensure no auto-generation happens
    await adminPage.waitForTimeout(3000);

    // Step 4: Verify no IRN was generated
    const detailResponse = await adminPage.request.get(`/api/invoices/${invoice.id}`);
    const detailData = await detailResponse.json();

    expect(detailData.invoice.irn).toBeNull();
    expect(detailData.invoice.e_invoice_status).toBeNull();
    expect(detailData.invoice.e_invoice_json).toBeNull();

    // Clean up
    await adminPage.request.delete(`/api/invoices/${invoice.id}`);
  });
});

authTest.describe("E-Invoicing - Error Handling", () => {
  authTest("rejects e-invoice generation without settings", async ({ adminPage }) => {
    // Create invoice without configuring e-invoice settings
    const createResponse = await adminPage.request.post("/api/invoices", {
      data: {
        currency: "INR",
        due_date: "2026-04-15",
        items: [
          {
            description: "Test Package",
            quantity: 1,
            unit_price: 75000,
            tax_rate: 18,
          },
        ],
      },
    });

    const createData = await createResponse.json();
    const invoice = createData.invoice;

    // Attempt to generate e-invoice without settings
    const generateResponse = await adminPage.request.post("/api/admin/e-invoicing/generate", {
      data: {
        invoice_id: invoice.id,
        seller_details: {
          legal_name: "Test Agency",
          address1: "123 Test St",
          location: "Bangalore",
          pincode: 560001,
          state_code: "29",
        },
        buyer_details: {
          legal_name: "Test Customer",
          address1: "456 Test Ave",
          location: "Mumbai",
          pincode: 400001,
          state_code: "27",
        },
      },
    });

    // Should fail with proper error message
    expect(generateResponse.status()).toBe(400);
    const errorData = await generateResponse.json();
    expect(errorData.error).toContain("credentials");

    // Clean up
    await adminPage.request.delete(`/api/invoices/${invoice.id}`);
  });

  authTest("rejects invalid GSTIN format in settings", async ({ adminPage }) => {
    const invalidSettings = {
      ...SANDBOX_CREDENTIALS,
      gstin: "INVALID_GSTIN",
    };

    const settingsResponse = await adminPage.request.post("/api/settings/e-invoicing", {
      data: invalidSettings,
    });

    // Should fail validation
    expect(settingsResponse.status()).toBe(400);
    const errorData = await settingsResponse.json();
    expect(errorData.error).toContain("GSTIN");
  });

  authTest("requires admin role for e-invoice operations", async ({ clientPage }) => {
    // Try to configure settings as non-admin
    const settingsResponse = await clientPage.request.post("/api/settings/e-invoicing", {
      data: SANDBOX_CREDENTIALS,
    });

    expect(settingsResponse.status()).toBe(403);

    // Try to generate e-invoice as non-admin
    const generateResponse = await clientPage.request.post("/api/admin/e-invoicing/generate", {
      data: {
        invoice_id: "test-id",
      },
    });

    expect(generateResponse.status()).toBe(403);

    // Try to cancel e-invoice as non-admin
    const cancelResponse = await clientPage.request.post("/api/admin/e-invoicing/cancel", {
      data: {
        invoice_id: "test-id",
        reason: "Test",
        remarks: "Test",
      },
    });

    expect(cancelResponse.status()).toBe(403);
  });
});

authTest.describe("E-Invoicing - GSTR-1 Export Formats", () => {
  authTest("exports GSTR-1 in CSV format", async ({ adminPage }) => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const csvResponse = await adminPage.request.get(
      `/api/admin/reports/gstr-1?month=${currentMonth}&format=csv`
    );

    expect(csvResponse.status()).toBe(200);
    expect(csvResponse.headers()['content-type']).toContain('text/csv');
    expect(csvResponse.headers()['content-disposition']).toContain(`gstr1-${currentMonth}.csv`);

    const csvContent = await csvResponse.text();
    expect(csvContent).toContain('GSTR-1 Export');
    expect(csvContent).toContain('B2B INVOICES');
    expect(csvContent).toContain('SUMMARY');
  });

  authTest("validates month parameter format", async ({ adminPage }) => {
    // Invalid month format
    const response1 = await adminPage.request.get("/api/admin/reports/gstr-1?month=2026-13");
    expect(response1.status()).toBe(400);

    // Missing month parameter
    const response2 = await adminPage.request.get("/api/admin/reports/gstr-1");
    expect(response2.status()).toBe(400);

    // Invalid format parameter
    const response3 = await adminPage.request.get("/api/admin/reports/gstr-1?month=2026-03&format=xml");
    expect(response3.status()).toBe(400);
  });
});
