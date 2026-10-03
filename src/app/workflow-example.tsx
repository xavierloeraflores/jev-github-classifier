"use client";

import { useState } from "react";

export function WorkflowExample({ workflow }: { workflow: string }) {
  const [status, setStatus] = useState("");

  async function copyWorkflow() {
    try {
      await navigator.clipboard.writeText(workflow);
      setStatus("Copied to clipboard.");
    } catch {
      setStatus("Could not copy. Select and copy the code below.");
    }
  }

  return (
    <div className="workflow">
      <div className="workflow-toolbar">
        <span>Workflow with editable labels</span>
        <button type="button" onClick={copyWorkflow}>Copy workflow</button>
      </div>
      <p className="copy-status" role="status">{status}</p>
      <pre tabIndex={0} aria-label="Workflow with editable labels"><code>{workflow}</code></pre>
    </div>
  );
}
