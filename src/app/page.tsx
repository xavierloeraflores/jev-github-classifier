import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SetupGuide } from "./setup-guide";

function readExamples(target: "issues" | "prs") {
  return {
    standard: readFileSync(join(process.cwd(), `examples/classify-${target}.yml`), "utf8"),
    custom: readFileSync(join(process.cwd(), `examples/classify-${target}-custom-labels.yml`), "utf8"),
  };
}

export default function Home() {
  return <SetupGuide issues={readExamples("issues")} prs={readExamples("prs")} />;
}
