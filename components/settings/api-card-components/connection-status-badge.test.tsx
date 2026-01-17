// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectionStatusBadge } from "./connection-status-badge";

describe("ConnectionStatusBadge", () => {
  it("renders loading state", () => {
    render(<ConnectionStatusBadge status="loading" />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("renders not-connected state", () => {
    render(<ConnectionStatusBadge status="not-connected" />);
    expect(screen.getByText("Not Connected")).toBeInTheDocument();
  });

  it("renders byop-connected state", () => {
    render(<ConnectionStatusBadge status="byop-connected" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });
});
