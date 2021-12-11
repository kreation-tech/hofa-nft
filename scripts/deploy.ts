/* eslint-disable no-process-exit */
import { ethers } from "hardhat";

async function deploy(contract: string) {
  console.log("Deploying " + contract + " in progress...");
  const factory = await ethers.getContractFactory(contract);
  const instance = await factory.deploy();
  await instance.deployed();
  console.log(contract + " deployed to: ", instance.address);
  return instance.address;
}

async function main() {
  await deploy("HofaNFT");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
