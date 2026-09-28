"use client";

import { useState } from "react";

export function WorkflowExample({ standard, custom }: { standard: string; custom: string }) {
  const [variant, setVariant] = useState("standard");
  const [status, setStatus] = useState("");
  const workflow = variant === "standard" ? standard : custom;

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
        <label>
          <span className="sr-only">Workflow example</span>
          <select value={variant} onChange={(event) => { setVariant(event.target.value); setStatus(""); }}>
            <option value="standard">Standard labels</option>
            <option value="custom">Custom labels</option>
          </select>
        </label>
        <button type="button" onClick={copyWorkflow}>Copy workflow</button>
      </div>
      <p className="copy-status" role="status">{status}</p>
      <pre tabIndex={0} aria-label={`${variant === "standard" ? "Standard" : "Custom"} labels workflow`}><code>{workflow}</code></pre>
    </div>
  );
}
