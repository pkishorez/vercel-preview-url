const { getDeploymentID, waitForDeploymentToBeReady } = require("./vercel");
const core = require("@actions/core");
const dotenv = require("dotenv");

dotenv.config();

try {
  (async () => {
    const deploymentID = await getDeploymentID();
    if (!deploymentID) {
      core.setFailed("Error.");
      return;
    }

    const deploymentStats = await waitForDeploymentToBeReady(deploymentID);

    console.log(
      `DEPLOYMENT STATS: ${JSON.stringify(
        {
          url: deploymentStats.url,
          readyState: deploymentStats.readyState,
          inspectorUrl: deploymentStats.inspectorUrl,
        },
        null,
        "  "
      )}`
    );

    core.setOutput("vercelDeploymentUrl", deploymentStats.url);
  })();
} catch (error) {
  core.setFailed(error.message);
}
