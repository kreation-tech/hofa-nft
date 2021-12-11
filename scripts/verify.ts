/* eslint-disable no-process-exit */
import { run, deployments, getChainId } from "hardhat";
import { readFileSync, writeFileSync } from "fs";

const { get } = deployments;
const contracts: { [name: string]: string } = {};

async function verify(contract: string, args: any[]) {
  const deployment = await get(contract);
  contracts[contract] = deployment.address;
  try {
    await run("verify:verify", {
      address: deployment.address,
      constructorArguments: args,
    });
  } catch (e) {
    console.log(e instanceof Error ? "WARNING: " + e.message : "ERROR: " + e);
  }
}

async function main() {
  const addresses = JSON.parse(readFileSync("./src/addresses.json", "utf-8"));
  addresses[await getChainId()] = contracts;

  await verify("HofaNFT", []);

  writeFileSync("./src/addresses.json", JSON.stringify(addresses, null, 2), {
    encoding: "utf-8",
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
