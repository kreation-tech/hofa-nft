/* eslint-disable no-process-exit */
import { deployments, getChainId } from "hardhat";
import { readFileSync, writeFileSync } from "fs";
import { ethers } from "ethers";

const { get } = deployments;
const contracts:{[name: string]: string} = {};
const roles:{[name: string]: string} = {};

async function addressOf(contract:string) {
  const deployment = await get(contract);
  contracts[contract] = deployment.address;
}

async function main() {
  const addresses = JSON.parse(readFileSync("./src/addresses.json", "utf-8"));
  addresses[await getChainId()] = contracts;

  await addressOf("HofaNFT");
  writeFileSync("./src/addresses.json", JSON.stringify(addresses, null, 2), { encoding: "utf-8" });

  roles.admin = await ethers.constants.HashZero;
  roles.minter = await ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
  writeFileSync("./src/roles.json", JSON.stringify(roles, null, 2), { encoding: "utf-8" });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
