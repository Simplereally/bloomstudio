/**
 * Tests for Field component set
 *
 * Tests form field layout components with various orientations and states.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
} from "./field";

describe("Field", () => {
  describe("rendering", () => {
    it("renders children", () => {
      render(<Field>Field content</Field>);
      expect(screen.getByText("Field content")).toBeInTheDocument();
    });

    it("has group role", () => {
      render(<Field>Content</Field>);
      expect(screen.getByRole("group")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(<Field data-testid="field" />);
      expect(screen.getByTestId("field")).toHaveAttribute("data-slot", "field");
    });
  });

  describe("orientation variants", () => {
    it("applies vertical orientation by default", () => {
      render(<Field data-testid="field" />);
      expect(screen.getByTestId("field")).toHaveAttribute(
        "data-orientation",
        "vertical"
      );
    });

    it("applies horizontal orientation", () => {
      render(<Field data-testid="field" orientation="horizontal" />);
      const field = screen.getByTestId("field");
      expect(field).toHaveAttribute("data-orientation", "horizontal");
      expect(field).toHaveClass("flex-row");
    });

    it("applies responsive orientation", () => {
      render(<Field data-testid="field" orientation="responsive" />);
      expect(screen.getByTestId("field")).toHaveAttribute(
        "data-orientation",
        "responsive"
      );
    });
  });
});

describe("FieldSet", () => {
  it("renders as fieldset element", () => {
    render(<FieldSet data-testid="fieldset" />);
    expect(screen.getByTestId("fieldset").tagName.toLowerCase()).toBe(
      "fieldset"
    );
  });

  it("has data-slot attribute", () => {
    render(<FieldSet data-testid="fieldset" />);
    expect(screen.getByTestId("fieldset")).toHaveAttribute(
      "data-slot",
      "field-set"
    );
  });

  it("renders children", () => {
    render(<FieldSet>Fieldset content</FieldSet>);
    expect(screen.getByText("Fieldset content")).toBeInTheDocument();
  });
});

describe("FieldLegend", () => {
  it("renders as legend element", () => {
    render(<FieldLegend data-testid="legend">Legend</FieldLegend>);
    expect(screen.getByTestId("legend").tagName.toLowerCase()).toBe("legend");
  });

  it("applies legend variant by default", () => {
    render(<FieldLegend data-testid="legend">Legend</FieldLegend>);
    expect(screen.getByTestId("legend")).toHaveAttribute(
      "data-variant",
      "legend"
    );
  });

  it("applies label variant", () => {
    render(
      <FieldLegend data-testid="legend" variant="label">
        Label
      </FieldLegend>
    );
    expect(screen.getByTestId("legend")).toHaveAttribute(
      "data-variant",
      "label"
    );
  });
});

describe("FieldGroup", () => {
  it("renders children", () => {
    render(<FieldGroup>Group content</FieldGroup>);
    expect(screen.getByText("Group content")).toBeInTheDocument();
  });

  it("has data-slot attribute", () => {
    render(<FieldGroup data-testid="group" />);
    expect(screen.getByTestId("group")).toHaveAttribute(
      "data-slot",
      "field-group"
    );
  });
});

describe("FieldContent", () => {
  it("renders children", () => {
    render(<FieldContent>Content</FieldContent>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("has data-slot attribute", () => {
    render(<FieldContent data-testid="content" />);
    expect(screen.getByTestId("content")).toHaveAttribute(
      "data-slot",
      "field-content"
    );
  });
});

describe("FieldLabel", () => {
  it("renders children", () => {
    render(<FieldLabel>Email</FieldLabel>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("has data-slot attribute", () => {
    render(<FieldLabel data-testid="label">Email</FieldLabel>);
    expect(screen.getByTestId("label")).toHaveAttribute(
      "data-slot",
      "field-label"
    );
  });
});

describe("FieldTitle", () => {
  it("renders children", () => {
    render(<FieldTitle>Title</FieldTitle>);
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("has data-slot attribute", () => {
    render(<FieldTitle data-testid="title" />);
    expect(screen.getByTestId("title")).toHaveAttribute(
      "data-slot",
      "field-label"
    );
  });

  it("applies font styling", () => {
    render(<FieldTitle data-testid="title" />);
    expect(screen.getByTestId("title")).toHaveClass("font-medium");
  });
});

describe("FieldDescription", () => {
  it("renders children", () => {
    render(<FieldDescription>Helper text</FieldDescription>);
    expect(screen.getByText("Helper text")).toBeInTheDocument();
  });

  it("renders as p element", () => {
    render(<FieldDescription data-testid="desc">Text</FieldDescription>);
    expect(screen.getByTestId("desc").tagName.toLowerCase()).toBe("p");
  });

  it("has data-slot attribute", () => {
    render(<FieldDescription data-testid="desc" />);
    expect(screen.getByTestId("desc")).toHaveAttribute(
      "data-slot",
      "field-description"
    );
  });

  it("uses muted text color", () => {
    render(<FieldDescription data-testid="desc" />);
    expect(screen.getByTestId("desc")).toHaveClass("text-muted-foreground");
  });
});

describe("FieldError", () => {
  describe("rendering", () => {
    it("renders children when provided", () => {
      render(<FieldError>Custom error message</FieldError>);
      expect(screen.getByText("Custom error message")).toBeInTheDocument();
    });

    it("renders nothing when no children or errors", () => {
      const { container } = render(<FieldError />);
      expect(container.firstChild).toBeNull();
    });

    it("has alert role", () => {
      render(<FieldError>Error</FieldError>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(<FieldError data-testid="error">Error</FieldError>);
      expect(screen.getByTestId("error")).toHaveAttribute(
        "data-slot",
        "field-error"
      );
    });
  });

  describe("errors prop", () => {
    it("renders single error message", () => {
      render(<FieldError errors={[{ message: "Email is required" }]} />);
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    it("renders multiple errors as list", () => {
      render(
        <FieldError
          errors={[{ message: "Error 1" }, { message: "Error 2" }]}
        />
      );
      expect(screen.getByText("Error 1")).toBeInTheDocument();
      expect(screen.getByText("Error 2")).toBeInTheDocument();
      expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("deduplicates identical error messages", () => {
      render(
        <FieldError
          errors={[
            { message: "Same error" },
            { message: "Same error" },
            { message: "Different error" },
          ]}
        />
      );
      // Should show as list since there are 2 unique errors
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(2);
    });

    it("filters out undefined errors", () => {
      render(<FieldError errors={[undefined, { message: "Valid error" }]} />);
      expect(screen.getByText("Valid error")).toBeInTheDocument();
    });

    it("renders nothing when errors array is empty", () => {
      const { container } = render(<FieldError errors={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("styling", () => {
    it("uses destructive text color", () => {
      render(<FieldError data-testid="error">Error</FieldError>);
      expect(screen.getByTestId("error")).toHaveClass("text-destructive");
    });
  });
});

describe("FieldSeparator", () => {
  it("renders without children", () => {
    render(<FieldSeparator data-testid="separator" />);
    expect(screen.getByTestId("separator")).toBeInTheDocument();
  });

  it("renders children in span", () => {
    render(<FieldSeparator>OR</FieldSeparator>);
    expect(screen.getByText("OR")).toBeInTheDocument();
  });

  it("has data-slot attribute", () => {
    render(<FieldSeparator data-testid="separator" />);
    expect(screen.getByTestId("separator")).toHaveAttribute(
      "data-slot",
      "field-separator"
    );
  });

  it("has data-content attribute when children present", () => {
    render(<FieldSeparator data-testid="separator">OR</FieldSeparator>);
    expect(screen.getByTestId("separator")).toHaveAttribute(
      "data-content",
      "true"
    );
  });

  it("has data-content false when no children", () => {
    render(<FieldSeparator data-testid="separator" />);
    expect(screen.getByTestId("separator")).toHaveAttribute(
      "data-content",
      "false"
    );
  });
});

describe("Field compound usage", () => {
  it("renders a complete form field", () => {
    render(
      <Field>
        <FieldLabel htmlFor="email">Email address</FieldLabel>
        <FieldContent>
          <input id="email" type="email" placeholder="Enter email" />
          <FieldDescription>We will never share your email</FieldDescription>
        </FieldContent>
      </Field>
    );

    expect(screen.getByText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
    expect(
      screen.getByText("We will never share your email")
    ).toBeInTheDocument();
  });

  it("renders a field with error state", () => {
    render(
      <Field data-invalid="true">
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <FieldContent>
          <input id="email" type="email" />
          <FieldError errors={[{ message: "Invalid email format" }]} />
        </FieldContent>
      </Field>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email format");
  });
});
