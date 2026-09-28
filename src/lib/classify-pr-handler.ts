export const classifications = [
  "bug", "documentation", "duplicate", "enhancement", "good first issue",
  "help wanted", "invalid", "question", "wontfix",
] as const;
export type Classification = (typeof classifications)[number];
export type LabelCriteria = Record<string, string>;
export const defaultCriteria = {
  bug: "Fixes existing behavior that is broken or differs from expected behavior.",
  enhancement: "Adds new functionality or improves existing functionality.",
  documentation: "Improvements or additions to documentation.",
  question: "A pull request asking a question or requiring more information to understand its intent.",
  duplicate: "Explicitly established as already covered by another issue or pull request.",
  "good first issue": "Explicitly identified as suitable for new contributors.",
  "help wanted": "Explicitly asks for additional contributor attention.",
  invalid: "Clearly established as not a valid pull request.",
  wontfix: "An explicit maintainer decision that the work will not proceed.",
} satisfies Record<Classification, string>;
export type PullRequestContent = { title: string; body: string };

type Options = {
  classify: (pullRequest: PullRequestContent, criteria: LabelCriteria) => Promise<string>;
};

const maxPayloadBytes = 512 * 1024;

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function handleClassifyPr(request: Request, options: Options) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return error("Content-Type must be application/json.", 415);
  }

  // Enforce the limit while reading, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return error("A JSON payload is required.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  let payload: unknown;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxPayloadBytes) {
        await reader.cancel();
        return error("Payload exceeds 512 KiB.", 413);
      }
      chunks.push(value);
    }
    payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return error("Invalid JSON payload.", 400);
  } finally {
    reader.releaseLock();
  }

  // Accept a GitHub event envelope or a direct pull request object.
  const pullRequest = isObject(payload) && "pull_request" in payload ? payload.pull_request : payload;
  if (
    !isObject(pullRequest) ||
    typeof pullRequest.title !== "string" ||
    !pullRequest.title.trim() ||
    pullRequest.title.length > 256 ||
    (pullRequest.body != null && typeof pullRequest.body !== "string") ||
    (typeof pullRequest.body === "string" && pullRequest.body.length > 65536)
  ) {
    return error("Provide a pull request with a nonempty title up to 256 characters and an optional body up to 65536 characters.", 400);
  }

  const labels = isObject(payload) ? payload.labels : undefined;
  if (labels !== undefined && (
    !isObject(labels) ||
    Object.entries(labels).some(([name, description]) =>
      !name.trim() || typeof description !== "string" || !description.trim(),
    )
  )) {
    return error("Provide labels as an object mapping nonempty label names to nonempty descriptions.", 400);
  }
  const criteria: LabelCriteria = isObject(labels) && Object.keys(labels).length > 0
    ? labels as LabelCriteria
    : defaultCriteria;

  try {
    const classification = await options.classify(
      { title: pullRequest.title, body: typeof pullRequest.body === "string" ? pullRequest.body : "" },
      criteria,
    );
    if (!Object.hasOwn(criteria, classification)) throw new Error("Invalid classification");
    return Response.json({ classification });
  } catch {
    return error("Pull request classification failed. Try again later.", 502);
  }
}
