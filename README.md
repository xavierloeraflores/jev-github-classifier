# Jev GitHub Labeler

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxavierloeraflores%2Fjev-issue-classifier)

Jev GitHub Labeler is a self-hosted Next.js API that classifies GitHub issues and pull requests using the Jev model through Vercel AI Gateway. The recommended GitHub Actions setup sends a title, optional body, and editable label criteria to `POST /api/classify-issue` for issues or `POST /api/classify-pr` for pull requests. The API returns one of the supplied labels, such as `bug`, `enhancement`, or `documentation`.

## Use with GitHub Actions

Automatically label new issues in your repository:

1. Deploy this API using the button above. Set `LABELER_API_KEY` in the deployment environment to a secret of your choice.
2. In your target repository's **Settings → Secrets and variables → Actions**, add a variable named `LABELER_URL` with your deployment base URL, such as `https://your-app.vercel.app` (without `/api/classify-issue`), and a secret named `LABELER_API_KEY` matching your deployment.
3. Copy this into `.github/workflows/classify-issues.yml` and commit it to your default branch:

```yaml
name: Classify issues

on:
  issues:
    types: [opened]

permissions:
  issues: write

jobs:
  classify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v8
        env:
          LABELER_URL: ${{ vars.LABELER_URL }}
          LABELER_API_KEY: ${{ secrets.LABELER_API_KEY }}
        with:
          script: |
            const { title, body } = context.payload.issue;
            // Edit these names and descriptions to match your repository.
            const labels = {
              bug: "Existing behavior is broken or differs from expected behavior.",
              enhancement: "A request for new functionality or an improvement.",
              documentation: "Improvements or additions to documentation.",
              question: "A usage question or an issue with insufficient information to determine its intent.",
              duplicate: "Explicitly established as already covered by another issue or pull request.",
              "good first issue": "Explicitly identified as suitable for new contributors.",
              "help wanted": "Explicitly asks for additional contributor attention.",
              invalid: "Clearly established as not a valid issue.",
              wontfix: "An explicit maintainer decision that the work will not proceed.",
            };
            const classifierUrl = new URL("/api/classify-issue", process.env.LABELER_URL);
            const response = await fetch(classifierUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.LABELER_API_KEY}`,
              },
              body: JSON.stringify({ title, body, labels }),
              signal: AbortSignal.timeout(60000),
            });
            if (!response.ok) {
              throw new Error(`Labeler returned HTTP ${response.status}`);
            }
            const { classification } = await response.json();
            await github.rest.issues.addLabels({
              ...context.repo,
              issue_number: context.issue.number,
              labels: [classification],
            });
```

Open an issue to try it. The workflow adds the suggested label and preserves existing labels. See the run in your repository's **Actions** tab.

The workflow sends a `labels` object mapping label names to descriptions. Edit these starter labels to match your repository. The API chooses only from the labels you send.

Complete workflow examples:

- [Issue workflow with editable starter labels](examples/classify-issues.yml)
- [Alternative issue labels](examples/classify-issues-custom-labels.yml), using names such as `type: bug`.

Copy one example into `.github/workflows/classify-issues.yml`. Both use the setup above.

## Classify pull requests with GitHub Actions

Use the same deployment, `LABELER_URL` variable, and `LABELER_API_KEY` secret configured above. Copy this into `.github/workflows/classify-prs.yml` and commit it to your default branch:

```yaml
name: Classify pull requests

on:
  # Reads PR metadata only. Do not check out or execute code from the PR.
  pull_request_target:
    types: [opened]

permissions:
  pull-requests: write

jobs:
  classify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v8
        env:
          LABELER_URL: ${{ vars.LABELER_URL }}
          LABELER_API_KEY: ${{ secrets.LABELER_API_KEY }}
        with:
          script: |
            const { title, body } = context.payload.pull_request;
            // Edit these names and descriptions to match your repository.
            const labels = {
              bug: "Fixes existing behavior that is broken or differs from expected behavior.",
              enhancement: "Adds new functionality or improves existing functionality.",
              documentation: "Improvements or additions to documentation.",
              question: "A pull request asking a question or with insufficient information to determine its intent.",
              duplicate: "Explicitly established as already covered by another issue or pull request.",
              "good first issue": "Explicitly identified as suitable for new contributors.",
              "help wanted": "Explicitly asks for additional contributor attention.",
              invalid: "Clearly established as not a valid pull request.",
              wontfix: "An explicit maintainer decision that the work will not proceed.",
            };
            const classifierUrl = new URL("/api/classify-pr", process.env.LABELER_URL);
            const response = await fetch(classifierUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.LABELER_API_KEY}`,
              },
              body: JSON.stringify({ title, body, labels }),
              signal: AbortSignal.timeout(60000),
            });
            if (!response.ok) {
              throw new Error(`Labeler returned HTTP ${response.status}`);
            }
            const { classification } = await response.json();
            await github.rest.issues.addLabels({
              ...context.repo,
              issue_number: context.payload.pull_request.number,
              labels: [classification],
            });
```

Edit the starter label names and descriptions to match your repository. The descriptions here classify proposed changes, such as a bug fix, rather than an issue reporting a bug.

Open a pull request to try it. The workflow sends its title, body, and label criteria to `/api/classify-pr`, adds the suggested label, and preserves existing labels. See the run in your repository's **Actions** tab.

Complete PR workflow examples:

- [Pull request workflow with editable starter labels](examples/classify-prs.yml)
- [Alternative pull request labels](examples/classify-prs-custom-labels.yml), using names such as `type: bug`.

Copy one example into `.github/workflows/classify-prs.yml`. Both use the setup above.
