import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectionStatusBadge } from "./connection-status-badge";

describe("ConnectionStatusBadge", () => {
  it("renders loading state", () => {
    render(<ConnectionStatusBadge status="loading" daysUntilExpiry={null} />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("renders not-connected state", () => {
    render(
      <ConnectionStatusBadge status="not-connected" daysUntilExpiry={null} />
    );
    expect(screen.getByText("Not Connected")).toBeInTheDocument();
  });

  it("renders expired state", () => {
    render(<ConnectionStatusBadge status="expired" daysUntilExpiry={null} />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("renders expiring-soon state with days", () => {
    render(
      <ConnectionStatusBadge status="expiring-soon" daysUntilExpiry={5} />
    );
    expect(screen.getByText("Expires in 5 days")).toBeInTheDocument();
  });

  it("renders byop-connected state with days", () => {
    render(
      <ConnectionStatusBadge status="byop-connected" daysUntilExpiry={25} />
    );
    expect(screen.getByText("Connected (25d)")).toBeInTheDocument();
  });

  it("renders legacy-active state", () => {
    render(
      <ConnectionStatusBadge status="legacy-active" daysUntilExpiry={null} />
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
