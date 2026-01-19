import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DeleteImageDialog } from "./delete-image-dialog";

// Mock Dialog UI
vi.mock("@/components/ui/alert-dialog", () => ({
    AlertDialog: ({ children }: any) => <div>{children}</div>,
    AlertDialogTrigger: ({ children, asChild }: any) => <div data-testid="trigger">{children}</div>,
    AlertDialogContent: ({ children }: any) => <div data-testid="content">{children}</div>,
    AlertDialogHeader: ({ children }: any) => <div data-testid="header">{children}</div>,
    AlertDialogTitle: ({ children }: any) => <div data-testid="title">{children}</div>,
    AlertDialogDescription: ({ children }: any) => <div data-testid="description">{children}</div>,
    AlertDialogFooter: ({ children }: any) => <div data-testid="footer">{children}</div>,
    AlertDialogCancel: ({ children, disabled }: any) => <button disabled={disabled}>{children}</button>,
    AlertDialogAction: ({ children, onClick, disabled }: any) => <button data-testid="confirm" onClick={onClick} disabled={disabled}>{children}</button>,
}));

// Mock Button
vi.mock("@/components/ui/button", () => ({ 
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button> 
}));

describe("DeleteImageDialog", () => {
    it("renders delete button", () => {
        render(<DeleteImageDialog onConfirm={async () => {}} />);
        const trigger = screen.getByTestId("trigger");
        const deleteButton = within(trigger).getByRole("button");
        
        expect(deleteButton).toBeInTheDocument();
        expect(deleteButton).toHaveTextContent("Delete");
        expect(deleteButton).not.toBeDisabled();
    });

    it("disables delete button when isDeleting prop is true", () => {
        render(<DeleteImageDialog onConfirm={async () => {}} isDeleting={true} />);
        const trigger = screen.getByTestId("trigger");
        const deleteButton = within(trigger).getByRole("button");
        expect(deleteButton).toBeDisabled();
    });

    it("renders customized title and description logic is within component", () => {
        const { container } = render(<DeleteImageDialog onConfirm={async () => {}} title="Custom" />);
        expect(container).toBeInTheDocument();
        // Since we mock AlertDialog to render children unconditionally, we can find the title
        expect(screen.getByTestId("title")).toHaveTextContent("Custom");
    });
});
