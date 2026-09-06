import { Random } from "../math/Random.js";

export class RandomFactory {
	/**
	 * @param {number} seed
	 */
	constructor(seed) {
		this.seed = seed;
	}

	/**
	 * Creates a new Random stream based on the factory's seed, an identity string, and a stream name.
	 * @param {string} identity
	 * @param {string} streamName
	 * @returns {Random}
	 */
	createStream(identity, streamName) {
		return new Random(Random.hashNumbers(this.seed, Random.hashString(identity), Random.hashString(streamName)));
	}
}
