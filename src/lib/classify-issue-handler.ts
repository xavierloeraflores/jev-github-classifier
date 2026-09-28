export const classifications = [
  "bug", "documentation", "duplicate", "enhancement", "good first issue",
  "help wanted", "invalid", "question", "wontfix",
] as const;
export type Classification = (typeof classifications)[number];
export type IssueContent = { title: string; body: string };

type Options = {
  classify: (issue: IssueContent) => Promise<Classification>;
};

const maxPayloadBytes = 512 * 1024;

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function handleClassifyIssue(request: Request, options: Options) {
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

  // Accept a GitHub event envelope or a direct issue object.
  const issue = isObject(payload) && "issue" in payload ? payload.issue : payload;
  if (
    !isObject(issue) ||
    typeof issue.title !== "string" ||
    !issue.title.trim() ||
    issue.title.length > 256 ||
    (issue.body != null && typeof issue.body !== "string") ||
    (typeof issue.body === "string" && issue.body.length > 65536)
  ) {
    return error("Provide an issue with a nonempty title up to 256 characters and an optional body up to 65536 characters.", 400);
  }

  try {
    const classification = await options.classify(
      { title: issue.title, body: typeof issue.body === "string" ? issue.body : "" },
    );
    if (!classifications.includes(classification)) throw new Error("Invalid classification");
    return Response.json({ classification });
  } catch {
    return error("Issue classification failed. Try again later.", 502);
  }
}
