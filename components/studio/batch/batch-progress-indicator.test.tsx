import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BatchProgressIndicator } from "./batch-progress-indicator";

// Mock dependencies
vi.mock("@/components/ui/button", () => ({ 
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button> 
}));
vi.mock("@/components/ui/progress", () => ({ 
    Progress: ({ value }: any) => <div data-testid="progress" data-value={value} /> 
}));

describe("BatchProgressIndicator", () => {
    const defaultJob: any = {
        id: "job-123",
        status: "processing",
        totalCount: 10,
        completedCount: 5,
        failedCount: 0,
        createdAt: Date.now(),
    };

    it("renders progress status text", () => {
        render(<BatchProgressIndicator batchJob={defaultJob} />);
        expect(screen.getByText("5/10 complete")).toBeInTheDocument();
        // 50%
        expect(screen.getByTestId("progress")).toHaveAttribute("data-value", "50");
    });

    it("displays estimated remaining time", () => {
        // 5 remaining * 15s = 75s = 2m remaining roughly?
        // Logic: remaining * 15 -> sec. ceil(sec/60) -> min.
        // 5*15 = 75. 75/60 = 1.25 -> 2. "2m remaining"
        render(<BatchProgressIndicator batchJob={defaultJob} />);
        expect(screen.getByText("2m remaining")).toBeInTheDocument();
    });

    it("renders cancel button when active and onCancel provided", () => {
        const onCancel = vi.fn();
        render(<BatchProgressIndicator batchJob={defaultJob} onCancel={onCancel} />);
        
        const btn = screen.getByTestId("cancel-batch-button");
        expect(btn).toBeInTheDocument();
        
        fireEvent.click(btn);
        expect(onCancel).toHaveBeenCalled();
    });

    it("disables cancel button when isCancelling is true", () => {
        render(
            <BatchProgressIndicator 
                batchJob={defaultJob} 
                onCancel={() => {}} 
                isCancelling={true} 
            />
        );
        const btn = screen.getByTestId("cancel-batch-button");
        expect(btn).toBeDisabled();
    });

    it("does not render cancel button when status is completed", () => {
        const completedJob = { ...defaultJob, status: "completed", completedCount: 10 };
        render(<BatchProgressIndicator batchJob={completedJob} onCancel={() => {}} />);
        expect(screen.queryByTestId("cancel-batch-button")).not.toBeInTheDocument();
        expect(screen.getByText("Completed (10/10)")).toBeInTheDocument();
    });

    it("displays failed count if > 0", () => {
        const failedJob = { ...defaultJob, failedCount: 2 };
        render(<BatchProgressIndicator batchJob={failedJob} />);
        expect(screen.getByText("2 failed")).toBeInTheDocument();
    });
});
