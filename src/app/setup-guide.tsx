"use client";

import { useState } from "react";
import { WorkflowExample } from "./workflow-example";

const repository = "https://github.com/xavierloeraflores/jev-issue-classifier";

type WorkflowFiles = { standard: string; custom: string };

type Props = {
  issues: WorkflowFiles;
  prs: WorkflowFiles;
};

export function SetupGuide({ issues, prs }: Props) {
  const [target, setTarget] = useState<"issues" | "prs">("issues");
  const isPr = target === "prs";
  const { standard, custom } = isPr ? prs : issues;
  const endpoint = isPr ? "/api/classify-pr" : "/api/classify-issue";
  const filename = `classify-${target}`;

  return (
    <main className="docs">
      <header className="site-header">
        <span className="wordmark">JEV / GitHub classifier</span>
        <a href={repository}>GitHub ↗</a>
      </header>

      <section className="intro" aria-labelledby="title">
        <p className="eyebrow">GitHub Actions · Setup guide</p>
        <h1 id="title">Give issues and PRs<br />a starting label.</h1>
        <p className="lede">Classify GitHub issues and pull requests with the Jev model through Vercel AI Gateway. Deploy the API, add a workflow, and automatically label new issues and PRs.</p>
        <div className="intro-links">
          <a className="primary-link" href={`https://vercel.com/new/clone?repository-url=${encodeURIComponent(repository)}`}>Deploy with Vercel ↗</a>
          <a href="#setup">Set up your workflow ↓</a>
        </div>
      </section>

      <section id="setup" className="doc-section" aria-labelledby="setup-title">
        <fieldset className="instruction-switch">
          <legend>Choose your instructions</legend>
          <div className="instruction-options">
            <label><input type="radio" name="instructions" value="issues" checked={!isPr} onChange={() => setTarget("issues")} /><span>Issues</span></label>
            <label><input type="radio" name="instructions" value="prs" checked={isPr} onChange={() => setTarget("prs")} /><span>Pull requests</span></label>
          </div>
        </fieldset>
        <p className="eyebrow">01 / Connect</p>
        <h2 id="setup-title">Set up your repository</h2>
        <ol className="steps">
          <li><h3>Deploy the API</h3><p>Use the deploy button above. Set <code>LABELER_API_KEY</code> in the deployment environment to a secret of your choice. The API uses Vercel AI Gateway with Vercel OIDC, or an <code>AI_GATEWAY_API_KEY</code> you configure.</p></li>
          <li><h3>Add your Actions configuration</h3><p>In the repository you want to label, open <strong>Settings → Secrets and variables → Actions</strong>.</p>
            <div className="settings"><p><span>Variable</span><code>LABELER_URL</code>Your deployment base URL, such as <code>https://your-app.vercel.app</code>, without <code>{endpoint}</code>.</p><p><span>Secret</span><code>LABELER_API_KEY</code>The same secret you set in your deployment.</p></div>
          </li>
          <li><h3>Add the workflow</h3><p>Copy an example below into <code>{`.github/workflows/${filename}.yml`}</code> and commit it to your default branch.</p></li>
        </ol>
      </section>

      <section className="doc-section" aria-labelledby="workflow-title">
        <p className="eyebrow">02 / Automate</p>
        <h2 id="workflow-title">Copy your workflow</h2>
        <p>The standard example uses labels such as <code>bug</code>, <code>enhancement</code>, and <code>documentation</code>. Choose custom labels to edit the label names and descriptions sent to the classifier.</p>
        <WorkflowExample key={target} standard={standard} custom={custom} />
        <p className="example-links">View example files: <a href={`${repository}/blob/HEAD/examples/${filename}.yml`}>Standard labels ↗</a><a href={`${repository}/blob/HEAD/examples/${filename}-custom-labels.yml`}>Custom labels ↗</a></p>
        <p>For custom labels, include a <code>labels</code> object mapping label names to descriptions in the JSON body. The API chooses from those labels.</p>
        <pre className="small-code"><code>{JSON.stringify({
          title: isPr ? "Fix the save button" : "The save button does nothing",
          body: isPr ? "Save pending changes when the Save button is clicked." : "Clicking Save leaves my changes unsaved.",
          labels: {
            bug: isPr ? "Fixes broken behavior" : "Broken behavior",
            enhancement: "New functionality",
          },
        }, null, 2)}</code></pre>
      </section>

      <section className="doc-section" aria-labelledby="try-title">
        <p className="eyebrow">03 / Verify</p>
        <h2 id="try-title">{isPr ? "Open a pull request to try it" : "Open an issue to try it"}</h2>
        <p>The workflow sends the {isPr ? "pull request" : "issue"} title and body to <code>POST {endpoint}</code> and adds the returned label. Existing labels stay in place. Check the run in your repository&apos;s <strong>Actions</strong> tab.</p>
        <p>If a run fails, confirm the endpoint URL and matching secrets. An HTTP <code>401</code> means the API secret did not match; <code>502</code> means classification failed.</p>
      </section>
      <footer>Jev GitHub Classifier <a href={`${repository}#readme`}>Read the README ↗</a></footer>
    </main>
  );
}
