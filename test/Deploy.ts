import "@nomiclabs/hardhat-ethers";

const { ethers } = require("hardhat");

describe("Deployments", function () {
  it("Should deploy HofaNFT", async function () {
    const HofaNFT = await ethers.getContractFactory("HofaNFT");
    await HofaNFT.deploy();
  });
});
