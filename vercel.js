const github = require("@actions/github");
const core = require("@actions/core");
const fetch = require("node-fetch");

async function getDeploymentID() {
  const projectId = core.getInput("projectId");
  const teamId = core.getInput("teamId");

  const githubRepoName = github.context.payload.repository?.name;
  const githubCommitSha =
    github.context.payload.after ?? github.context.payload.before;

  console.log(
    "GITHUB REPO: " +
      JSON.stringify(
        {
          githubRepoName,
          githubCommitSha,
          projectId,
          teamId,
          payload: github.context.payload,
        },
        null,
        "  "
      )
  );

  let waiting = 0;
  while (true) {
    let obj = {
      limit: 100,
    };
    if (projectId) {
      obj.projectId = projectId;
    }
    if (teamId) {
      obj.teamId = teamId;
    }

    const params = new URLSearchParams(obj).toString();
    const data = await fetch(
      `https://api.vercel.com/v6/deployments?${params}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        },
        method: "get",
      }
    ).then((v) => v.json());

    const deployments = data.deployments;
    const result = deployments.find(
      (deployment) =>
        deployment.meta.githubCommitRepo === githubRepoName &&
        deployment.meta.githubCommitSha === githubCommitSha
    );

    if (result) {
      return result.uid;
    } else {
      if (waiting === 5) {
        core.setFailed("Max retries reached!");
        console.log(
          "github.context.payload: ",
          JSON.stringify(github.context.payload, null, "  ")
        );
        return null;
      }
    }
    await new Promise((r) => setTimeout(r, 5000));
    console.log("Waiting: ", waiting++);
  }
}

async function getDeploymentStats(deploymentID) {
  const data = await fetch(
    `https://api.vercel.com/v6/deployments/${deploymentID}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      },
      method: "get",
    }
  ).then((v) => v.json());

  return data;
}

async function waitForDeploymentToBeReady(deploymentID) {
  let retries = 0;

  while (true) {
    const deploymentStats = await getDeploymentStats(deploymentID);

    if (deploymentStats.readyState === "READY") {
      return deploymentStats;
    }

    await new Promise((r) => setTimeout(r, 5000));
    console.log("RETRY: ", retries++);
  }
}

module.exports = {
  getDeploymentID,
  getDeploymentStats,
  waitForDeploymentToBeReady,
};
