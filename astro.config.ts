import { defineConfig } from "astro/config";

const [owner, repository] = (process.env.GITHUB_REPOSITORY ?? "/").split("/");
const projectPages = Boolean(repository && !repository.endsWith(".github.io"));

export default defineConfig({
  output: "static",
  site: owner ? `https://${owner}.github.io` : "http://localhost:4321",
  base: projectPages ? `/${repository}` : "/",
});
