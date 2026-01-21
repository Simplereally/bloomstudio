import { describe, expect, it } from "vitest";

import { RESOURCES, SOLUTIONS } from "./seo-config";

describe("seo-config exports", () => {
  it("keeps the solutions order stable", () => {
    const slugs = SOLUTIONS.map((solution) => solution.slug);

    expect(slugs).toEqual([
      "blueprints",
      "ai-image-generator",
      "ai-art-generator",
      "ai-video-generator",
      "transparent-png-generator",
      "ai-marketing-tools",
      "ai-graphic-design",
      "ai-print-on-demand",
      "ai-photography",
      "ai-interior-design",
      "ai-architecture",
    ]);
  });

  it("exports the expected resource links", () => {
    expect(RESOURCES).toEqual([
      { name: "About", href: "/about" },
      { name: "Pricing", href: "/pricing" },
      { name: "FAQ", href: "/faq" },
      { name: "Support", href: "/support" },
      { name: "Contact us", href: "/contact" },
      { name: "Sitemap", href: "/site-map" },
    ]);
  });
});
