"use client";

import Button from "@/components/ui/Button";

export default function UserManualPrintButton() {
  return (
    <div className="manual-print-controls mb-6 flex justify-end print:hidden">
      <Button
        variant="secondary"
        onClick={() => window.print()}
      >
        Print User Manual
      </Button>
    </div>
  );
}
