import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SetupGuide } from "./setup-guide";

function readExample(target: "issues" | "prs") {
  return readFileSync(join(process.cwd(), `examples/classify-${target}.yml`), "utf8");
}

export default function Home() {
  return <SetupGuide issues={readExample("issues")} prs={readExample("prs")} />;
}
