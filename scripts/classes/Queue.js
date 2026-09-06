/**
 * A simple queue implementation.
 * @template T
 */
export class Queue {
	constructor() {
		/** @type {T[]} */
		this.items = [];

		/** @type {Set<T>} */
		this.itemSet = new Set();

		this.head = 0;
	}

	get length() {
		return this.items.length - this.head;
	}

	/**
	 * Checks whether an item is currently in the queue.
	 * @param {T} item
	 * @returns {boolean}
	 */
	has(item) {
		return this.itemSet.has(item);
	}

	/**
	 * Adds an item to the end of the queue.
	 * @param {T} item
	 */
	enqueue(item) {
		this.items.push(item);
		this.itemSet.add(item);
	}

	/**
	 * Removes and returns the item at the front of the queue.
	 * @returns {T | undefined}
	 */
	dequeue() {
		if (this.head >= this.items.length) {
			return undefined;
		}

		const item = this.items[this.head++];

		this.itemSet.delete(item);

		if (this.head === this.items.length) {
			this.items = [];
			this.head = 0;
		}

		return item;
	}

	clear() {
		this.items = [];
		this.itemSet.clear();
		this.head = 0;
	}
}
