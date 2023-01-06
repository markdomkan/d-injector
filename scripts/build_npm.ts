// ex. scripts/build_npm.ts
import { build, emptyDir } from "https://deno.land/x/dnt@0.32.1/mod.ts";

const version = Deno.args[0];

if (!version) {
  console.error("Please provide a version number");
  Deno.exit(1);
}

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    name: "@markdomkan/d-injector",
    version,
    description:
      "D-injector is a really simple and tinny dependency injection library for Deno or Node.js.",
    author: "Mark Domkan",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/markdomkan/d-injector.git",
    },
    bugs: {
      url: "https://github.com/markdomkan/d-injector/issues",
    },
    homepage: "https://github.com/markdomkan/d-injector#readme",
  },
});

// post build steps
Deno.copyFileSync("README.md", "npm/README.md");

console.log("Publishing package to npm");
const publishProcess = Deno.run({
  cmd: ["npm", "publish", "--access", "public"],
  cwd: "./npm",
});

await publishProcess.status();
await emptyDir("./npm");
