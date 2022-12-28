const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

try {
  (async () => {
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput("who-to-greet");
    console.log(`Hello ${nameToGreet}!`);
    const time = new Date().toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);

    const githubRepoName = github.context.payload.repository?.name; // ?? "sample-nextjs-repo";
    const githubCommitSha = github.context.payload.after; // ??"3569155c4430cd6b6c1d612d6dc57a302f3fae31";

    console.log(
      "GITHUB REPO: " +
        JSON.stringify({ githubRepoName, githubCommitSha }, null, "  ")
    );

    const data = await fetch("https://api.vercel.com/v6/deployments", {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      },
      method: "get",
    }).then((v) => v.json());

    while (true) {
      const deployments = data.deployments;
      const result = deployments.find(
        (deployment) =>
          deployment.meta.githubCommitRepo === githubRepoName &&
          deployment.meta.githubCommitSha === githubCommitSha
      );

      if (result) {
        console.log("DATA: ", JSON.stringify(result, null, "  "));
        break;
      } else {
        console.log("DEPLOYMENTS: " + JSON.stringify(deployments, null, "  "));
        break;
      }
      await new Promise((r) => setTimeout(r, 10000));
    }
  })();
} catch (error) {
  core.setFailed(error.message);
}
