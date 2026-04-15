// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DrillDownTable from "@/components/god-mode/DrillDownTable";

type Row = {
  name: string;
  email: string;
};

describe("DrillDownTable", () => {
  it("searches across visible columns by default when searchKeys are not provided", async () => {
    const rows: Row[] = [
      { name: "Avi Reddy", email: "avi@example.com" },
      { name: "Nora Lane", email: "nora@example.com" },
    ];

    render(
      <DrillDownTable<Row>
        searchable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
        ]}
        data={rows}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText("Search..."), "avi");

    expect(screen.getByText("Avi Reddy")).toBeInTheDocument();
    expect(screen.queryByText("Nora Lane")).not.toBeInTheDocument();
  });
});
