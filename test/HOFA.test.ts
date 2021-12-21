/* eslint-disable node/no-missing-import */
/* eslint-disable quotes */
import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { HofaNFT } from "../src/types";
import { HOFA } from "../src/HOFA";

const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

let artist: SignerWithAddress;
let hofa: SignerWithAddress;
let someone: SignerWithAddress;
let receiver: SignerWithAddress;
let facade: HOFA;
let contractAddress:string;

describe("HOFA facade", function () {
    beforeEach(async () => {
      [hofa, artist, someone, receiver] = await ethers.getSigners();
      const { HofaNFT } = await deployments.fixture(["NFT"]);
      contractAddress = HofaNFT.address;
      const contract = (await ethers.getContractAt("HofaNFT", HofaNFT.address)) as HofaNFT;
      await contract.connect(hofa).grantRole(await contract.MINTER_ROLE(), artist.address);
      facade = new HOFA(artist, HofaNFT.address);
    });

    it("Can produce valid metadata for static content", async function () {
        expect(await facade.metadata("Piece title", "A long description", "https://ipfs.io/ipfs/bafybeigr4qpkyvzj7adu3zwvnxfctxd7sa2die3bnnu63wcfokwnxtlnja", "0x6af4b97a176f026958547cd0137600e82130bb05f971da36c7dff96655ca2ca9"))
            .to.have.string('"name":"Piece title"')
            .and.to.have.string('"sha256":"0x6af4b97a176f026958547cd0137600e82130bb05f971da36c7dff96655ca2ca9"')
            .and.to.have.string('"image":"https://ipfs.io/ipfs/bafybeigr4qpkyvzj7adu3zwvnxfctxd7sa2die3bnnu63wcfokwnxtlnja"')
            .and.to.have.string('"description":"A long description"')
            .and.not.to.have.string("animation_url");
    });

    it("Can produce valid metadata for animated content", async function () {
        expect(await facade.metadata("Piece title", "A long description", "https://ipfs.io/ipfs/bafybeigr4qpkyvzj7adu3zwvnxfctxd7sa2die3bnnu63wcfokwnxtlnja", "0x6af4b97a176f026958547cd0137600e82130bb05f971da36c7dff96655ca2ca9", "https://ipfs.io/ipfs/QmSw4ExBfNp6m7YjyUYXwsfV9PVREiUxawQLQn763nCbfd"))
            .to.have.string('"name":"Piece title"')
            .and.to.have.string('"sha256":"0x6af4b97a176f026958547cd0137600e82130bb05f971da36c7dff96655ca2ca9"')
            .and.to.have.string('"image":"https://ipfs.io/ipfs/QmSw4ExBfNp6m7YjyUYXwsfV9PVREiUxawQLQn763nCbfd"')
            .and.to.have.string('"description":"A long description"')
            .and.to.have.string('"animation_url":"https://ipfs.io/ipfs/bafybeigr4qpkyvzj7adu3zwvnxfctxd7sa2die3bnnu63wcfokwnxtlnja"');
    });

    it("Can grant artists permissions", async function () {
        const admin = new HOFA(hofa, contractAddress);
        await expect(await admin.isArtist(someone.address)).to.be.false;
        await expect(await admin.grantArtist(someone.address)).to.be.true;
        await expect(await admin.isArtist(someone.address)).to.be.true;
        await expect(await admin.grantArtist(someone.address)).to.be.false; // if already granted returns false
    });

    it("Can revoke artist permissions", async function () {
        const admin = new HOFA(hofa, contractAddress);
        await expect(await admin.isArtist(artist.address)).to.be.true;
        await expect(await admin.revokeArtist(artist.address)).to.be.true;
        await expect(await admin.isArtist(artist.address)).to.be.false;
        await expect(await admin.revokeArtist(artist.address)).to.be.false; // if already revoked returns false
    });

    it("Can grant and revoke admin permissions", async function () {
        const admin = new HOFA(hofa, contractAddress);
        await expect(await admin.isAdmin(someone.address)).to.be.false;
        await expect(await admin.grantAdmin(someone.address)).to.be.true;
        await expect(await admin.isAdmin(someone.address)).to.be.true;
        await expect(await admin.revokeAdmin(someone.address)).to.be.true;
        await expect(await admin.isAdmin(someone.address)).to.be.false;
        await expect(await admin.revokeAdmin(someone.address)).to.be.false; // if already revoked returns false
        await expect(await admin.isAdmin(someone.address)).to.be.false;
    });

    it("Can approve transfers", async function () {
        const tokenId = await facade.mint(
            "https://ipfs.io/ipfs/bafybeigr4qpkyvzj7adu3zwvnxfctxd7sa2die3bnnu63wcfokwnxtlnja",
            "0x6af4b97a176f026958547cd0137600e82130bb05f971da36c7dff96655ca2ca9",
            1500);
        await expect(await facade.approve(receiver.address, tokenId)).to.be.true;
    });
});
