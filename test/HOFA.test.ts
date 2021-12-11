/* eslint-disable prettier/prettier */
import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { HofaNFT } from "../src/types";
import { HOFA } from "../src/HOFA";
import { promises as fs } from 'fs';

const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

let artist: SignerWithAddress;
let hofa: SignerWithAddress;
let someone: SignerWithAddress;
let receiver: SignerWithAddress;
let facade: HOFA;

describe("HOFA", function () {
    beforeEach(async () => {
      [hofa, artist, someone, receiver] = await ethers.getSigners();
      const { HofaNFT } = await deployments.fixture(["NFT"]);
      const contract = (await ethers.getContractAt("HofaNFT", HofaNFT.address)) as HofaNFT;
      await contract.connect(hofa).grantRole(await contract.MINTER_ROLE(), artist.address);
      facade = new HOFA(artist, HofaNFT.address);
    });
  
    it("can produce valid metadata", async function () {
        expect(await facade.metadata("Piece title", "A long description", "https://ipfs.io/ipfs/bafybeigr4qpkyvzj7adu3zwvnxfctxd7sa2die3bnnu63wcfokwnxtlnja", "0x6af4b97a176f026958547cd0137600e82130bb05f971da36c7dff96655ca2ca9"))
            .to.have.string("\"name\":\"Piece title\"")
            .and.to.have.string("\"sha256\":\"0x6af4b97a176f026958547cd0137600e82130bb05f971da36c7dff96655ca2ca9\"")
            .and.to.have.string("\"creator\":\"" + artist.address + "\"")
            .and.to.have.string("\"image\":\"https://ipfs.io/ipfs/bafybeigr4qpkyvzj7adu3zwvnxfctxd7sa2die3bnnu63wcfokwnxtlnja\"")
            .and.to.have.string("\"description\":\"A long description\"");
    });

    it("can produce valid hash", async function () {
        const buf = await fs.readFile('./tsconfig.json');
		expect(await HOFA.hash(buf)).to.equal('0xdb7b4dc13c7803e76077f8dd647a0cee23762eeb4c5e515ee862cfe00f3b103a');
    });
});