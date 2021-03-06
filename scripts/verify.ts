/* eslint-disable no-process-exit */
import { run, deployments } from "hardhat";

const { get } = deployments;

async function verify(contract: string, args: any[]) {
  const deployment = await get(contract);
  try {
    await run("verify:verify", {
      address: deployment.address,
      constructorArguments: args
    });
  } catch (e) {
    console.log(e instanceof Error ? "WARNING: " + e.message : "ERROR: " + e);
  }
}

async function main() {
  await verify("HofaNFT", []);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
