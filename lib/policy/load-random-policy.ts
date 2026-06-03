import fs from "node:fs";
import path from "node:path";

const POLICY_DIR = path.join(process.cwd(), "policy");

export function loadRandomPolicyHtml(): string {
  const files = fs
    .readdirSync(POLICY_DIR)
    .filter((name) => path.extname(name) === ".html");

  if (files.length === 0) {
    throw new Error("No policy .html files found in policy/");
  }

  const file = files[Math.floor(Math.random() * files.length)]!;
  return fs.readFileSync(path.join(POLICY_DIR, file), "utf8");
}
