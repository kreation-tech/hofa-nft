/* eslint-disable node/no-missing-import */
/* eslint-disable block-spacing */
/* eslint-disable brace-style */
/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▒▀█░█▀░▒█▒
 *
 * Made with 🧡 by www.Kreation.tech
 */

import { Provider } from "@ethersproject/providers";
import { Signer } from "@ethersproject/abstract-signer";
// eslint-disable-next-line camelcase
import { HofaNFT__factory } from "./types";
import type { HofaNFT } from "./types";
import addresses from "./addresses.json";
import roles from "./roles.json";
import { BigNumberish } from "@ethersproject/bignumber";

export class HOFA {
	private signerOrProvider: Signer | Provider;
	public impl: HofaNFT;

    constructor(signerOrProvider: Signer | Provider, factoryAddressOrChainId: string | number) {
		this.signerOrProvider = signerOrProvider;
		if (typeof (factoryAddressOrChainId) !== "string") {
			const contracts:{[key: string]: string} = (addresses as {[key: string]: {[name: string]: string}})[factoryAddressOrChainId.toString()];
			if (!contracts) throw new Error("Unknown chain with id " + factoryAddressOrChainId);
			this.impl = HofaNFT__factory.connect(contracts.HofaNFT, signerOrProvider);
		} else {
			this.impl = HofaNFT__factory.connect(factoryAddressOrChainId as string, signerOrProvider);
		}
	}

	/**
	 * Determines the chain identifier
	 *
	 * @param signerOrProvider the signer or the provider
	 */
	public static async getChainId(signerOrProvider: Signer | Provider): Promise<number> {
		return new Promise((resolve, reject) => {
			const chainId = (signerOrProvider as Signer).getChainId();
			if (chainId === undefined) {
				(signerOrProvider as Provider).getNetwork().then(network => {
					resolve(network.chainId);
				});
			}
			resolve(chainId);
		});
	}

	public async mint(uri:string, hash:string, royalties?:number, confirmations:number = 1, callback?:(received:number, requested:number) => void): Promise<number> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const tx = await this.impl.mint(uri, hash, royalties || 0);
                let received = tx.confirmations;
				let receipt = await tx.wait();
				while (received < confirmations) {
					if (callback) callback(received, confirmations);
					receipt = await tx.wait(received++);
				}
				for (const log of receipt.events!) {
					if (log.event === "Transfer") {
						resolve(log.args![2]);
					}
				}
			} catch (err) {
				reject(err);
			}
		})();});
	}

	public async approve(to:string, tokenId:BigNumberish, confirmations:number = 1, callback?:(received:number, requested:number) => void): Promise<boolean> {
		return new Promise((resolve) => {
			this.impl.approve(to, tokenId).then((tx) => { (async() => {
                let received = tx.confirmations;
				while (received < confirmations) {
					if (callback) callback(received, confirmations);
					await tx.wait(received++);
				}
                resolve(true);
			})();});
		});
	}

	public async metadata(title:string, description:string, uri:string, hash:string, thumbnail?:string): Promise<string> {
		return new Promise((resolve, reject) => {
			(this.signerOrProvider as Signer).getAddress().then((address) => {
				const metadata = {
					name: title,
					description: description,
					image: (thumbnail || uri),
					animation_url: thumbnail ? uri : undefined,
					properties: {
						sha256: hash
					}
				};
				resolve(JSON.stringify(metadata));
			});
		});
	}

	/**
	 * Grants artist permissions to an address
	 *
	 * @param address the address to grant
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 * @param callback a function to receive notifications about confirmations received
	 */
	public async grantArtist(address:string, confirmations:number = 1, callback?:(received:number, requested:number) => void): Promise<boolean> {
		return this._grantRole(roles.minter, address, confirmations, callback);
	}

	/**
	 * Revokes artist permissions from an address
	 *
	 * @param address the address to revoke
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 * @param callback a function to receive notifications about confirmations received
	 */
	public async revokeArtist(address:string, confirmations:number = 1, callback?:(received:number, requested:number) => void): Promise<boolean> {
		return this._revokeRole(roles.minter, address, confirmations, callback);
	}

	/**
	 * Checks if an address is listed as artist
	 *
	 * @param address the address to check, defaults to current signer
	 */
	public async isArtist(address?:string): Promise<boolean> {
		return this._hasRole(roles.minter, address);
	}

	/**
	 * Grants artist permissions to an address
	 *
	 * @param address the address to grant
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 * @param callback a function to receive notifications about confirmations received
	 */
	public async grantAdmin(address:string, confirmations:number = 1, callback?:(received:number, requested:number) => void): Promise<boolean> {
		return this._grantRole(roles.admin, address, confirmations, callback);
	}

	/**
	 * Revokes artist permissions from an address
	 *
	 * @param address the address to revoke
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 * @param callback a function to receive notifications about confirmations received
	 */
	public async revokeAdmin(address:string, confirmations:number = 1, callback?:(received:number, requested:number) => void): Promise<boolean> {
		return this._revokeRole(roles.admin, address, confirmations, callback);
	}

	/**
	 * Checks if an address is listed as admin
	 *
	 * @param address the address to check, defaults to current signer
	 */
	public async isAdmin(address?:string): Promise<boolean> {
		return this._hasRole(roles.admin, address);
	}

	/**
	 * Grants permissions to an address
	 *
	 * @param address the address to grant
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 */
	private async _grantRole(role:string, address:string, confirmations:number = 1, callback?:(received:number, requested:number) => void): Promise<boolean> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const tx = await this.impl.grantRole(role, address);
				let received = tx.confirmations;
				let receipt = await tx.wait();
				while (received < confirmations) {
					if (callback) callback(received, confirmations);
					receipt = await tx.wait(received++);
				}
				for (const log of receipt.events!) {
					if (log.event === "RoleGranted") {
						resolve(true);
					}
				}
				resolve(false);
			} catch (err) {
				reject(err);
			}
		})();});
	}

	/**
	 * Revokes permissions from an address
	 *
	 * @param address the address to revoke
	 * @param confirmations the number of confirmations to wait for, deafults to 1
	 */
	private async _revokeRole(role:string, address:string, confirmations:number = 1, callback?:(received:number, requested:number) => void): Promise<boolean> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				const tx = await this.impl.revokeRole(role, address);
				let received = tx.confirmations;
				let receipt = await tx.wait();
				while (received < confirmations) {
					if (callback) callback(received, confirmations);
					receipt = await tx.wait(received++);
				}
				for (const log of receipt.events!) {
					if (log.event === "RoleRevoked") {
						resolve(true);
					}
				}
				resolve(false);
			} catch (err) {
				reject(err);
			}
		})();});
	}

	/**
	 * Checks if an address has been granted a role
	 *
	 * @param address the address to check, defaults to current signer
	 */
	private async _hasRole(role:string, address?:string): Promise<boolean> {
		return new Promise((resolve, reject) => { (async() => {
			try {
				resolve(this.impl.hasRole(role, address || await (this.signerOrProvider as Signer).getAddress()));
			} catch (err) {
				reject(err);
			}
		})();});
	}
}
