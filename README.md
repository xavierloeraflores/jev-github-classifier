# jev-issue-classifier

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxavierloeraflores%2Fjev-issue-classifier)

A Next.js API that classifies GitHub issues using the Jev model through Vercel AI Gateway. Send an issue title and optional body to `POST /api/classify-issue` to receive a suggested GitHub label such as `bug`, `enhancement`, or `documentation`.

## Use with GitHub Actions

Automatically label new issues in your repository:

1. Deploy this API using the button above. Set `API_SECRET_KEY` in the deployment environment to a secret of your choice.
2. In your target repository's **Settings → Secrets and variables → Actions**, add a variable named `CLASSIFIER_URL` with your full endpoint URL, such as `https://your-app.vercel.app/api/classify-issue`, and a secret named `API_SECRET_KEY` matching your deployment.
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
          CLASSIFIER_URL: ${{ vars.CLASSIFIER_URL }}
          API_SECRET_KEY: ${{ secrets.API_SECRET_KEY }}
        with:
          script: |
            const { title, body } = context.payload.issue;
            const response = await fetch(process.env.CLASSIFIER_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
              },
              body: JSON.stringify({ title, body }),
              signal: AbortSignal.timeout(60000),
            });
            if (!response.ok) {
              throw new Error(`Classifier returned HTTP ${response.status}`);
            }
            const { classification } = await response.json();
            await github.rest.issues.addLabels({
              ...context.repo,
              issue_number: context.issue.number,
              labels: [classification],
            });
```

Open an issue to try it. The workflow adds the suggested label and preserves existing labels. See the run in your repository's **Actions** tab.

For custom labels, include a `labels` object mapping label names to descriptions in the JSON body, for example `JSON.stringify({ title, body, labels: { bug: "Broken behavior", enhancement: "New functionality" } })`.

Complete workflow examples:

- [Standard labels](examples/classify-issues.yml)
- [Custom labels](examples/classify-issues-custom-labels.yml), with editable label names and descriptions.

Copy one example into `.github/workflows/classify-issues.yml`. Both use the setup above.
