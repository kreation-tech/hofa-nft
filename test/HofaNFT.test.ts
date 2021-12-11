import { BigNumber } from "@ethersproject/bignumber";
import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { HofaNFT } from "../src/types";

const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

let artist: SignerWithAddress;
let hofa: SignerWithAddress;
let someone: SignerWithAddress;
let receiver: SignerWithAddress;
let contract: HofaNFT;

describe("HOFA NFT Smartcontract", function () {
  beforeEach(async () => {
    [hofa, artist, someone, receiver] = await ethers.getSigners();
    const { HofaNFT } = await deployments.fixture(["NFT"]);
    contract = (await ethers.getContractAt("HofaNFT", HofaNFT.address)) as HofaNFT;
    await contract.deployed();
    await contract.connect(hofa).grantRole(await contract.MINTER_ROLE(), artist.address);
  });

  it("Artists only should be able to mint", async function () {
    await contract.connect(artist).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0);
    expect(await contract.connect(someone).ownerOf(0)).to.be.equal(artist.address);

    await expect(contract.connect(receiver).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0)).to.be.revertedWith("AccessControl");
    await expect(contract.connect(someone).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0)).to.be.revertedWith("AccessControl");
  });

  it("Admins only should be able to grant minting", async function () {
    const role = await contract.MINTER_ROLE();
    await contract.connect(hofa).grantRole(role, someone.address);
    await contract.connect(someone).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0);
    expect(await contract.totalSupply()).to.be.equal(1);

    await expect(contract.connect(artist).grantRole(role, someone.address))
      .to.be.revertedWith("AccessControl");
    await expect(contract.connect(someone).grantRole(role, someone.address))
      .to.be.revertedWith("AccessControl");
  });

  it("Should prevent minting of duplicated content", async function () {
    await contract.connect(artist).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0);

    expect(await contract.connect(someone).tokenURI(0)).to.be.equal("ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d");

    await expect(contract.connect(hofa).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0)).to.be.revertedWith("Duplicated content");
  });

  it("Should return the metadata URI when requested", async function () {
    await contract.connect(artist).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0);

    expect(await contract.connect(someone).tokenURI(0)).to.be.equal("ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d");
  });

  it("Should allow retrieving creator", async function () {
    await contract.connect(artist).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0);
    await contract.connect(artist).transferFrom(artist.address, receiver.address, 0);
    expect(await contract.connect(someone).ownerOf(0)).to.be.equal(receiver.address);
    expect(await contract.connect(someone).creatorOf(0)).to.be.equal(artist.address);
  });

  it("Should allow retrieving creations", async function () {
    await contract.connect(artist).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0);
    await contract.connect(hofa).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x05db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0);
    await contract.connect(artist).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x06db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0);
    await contract.connect(artist).transferFrom(artist.address, receiver.address, 0);
    await contract.connect(artist).transferFrom(artist.address, hofa.address, 2);
    expect(await contract.connect(someone).creationsOf(hofa.address)).to.be.deep.equal([BigNumber.from(1)]);
    expect(await contract.connect(someone).creationsOf(artist.address)).to.be.deep.equal([BigNumber.from(0), BigNumber.from(2)]);
  });

  it("Should conform to ERC2981 royalties", async function () {
    await contract.connect(artist).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      100);
    await contract.connect(artist).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x05db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      2500);

    expect(await contract.connect(someone).royaltyInfo(0, ethers.utils.parseEther("1.0")))
      .to.be.deep.equal([artist.address, ethers.utils.parseEther("0.01")]);

    expect(await contract.connect(someone).royaltyInfo(1, ethers.utils.parseEther("2.0")))
      .to.be.deep.equal([artist.address, ethers.utils.parseEther("0.50")]);
  });

  it("Owner only can approve token", async function () {
    await contract.connect(artist).mint(
      "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      0);

    await contract.connect(artist).approve(receiver.address, 0);
    expect(await contract.connect(receiver).getApproved(0)).to.be.equal(receiver.address);
  });
});
