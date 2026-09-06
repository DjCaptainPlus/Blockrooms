export class Random {
	constructor(seed) {
		this.seed = seed >>> 0;

		this.a = 1664525;
		this.c = 1013904223;
		this.m = 2 ** 32;
	}

	_next() {
		this.seed = (Math.imul(this.a, this.seed) + this.c) >>> 0;

		return this.seed;
	}

	int() {
		return this._next();
	}

	float() {
		return this._next() / this.m;
	}

	intRange(min, max) {
		return Math.floor(this.float() * (max - min + 1)) + min;
	}

	floatRange(min, max) {
		return this.float() * (max - min) + min;
	}

	static hashString(string) {
		let hash = 2166136261;

		for (let i = 0; i < string.length; i++) {
			hash ^= string.charCodeAt(i);
			hash = Math.imul(hash, 16777619);
		}

		return hash >>> 0;
	}

	static hashNumbers(...numbers) {
		let hash = 2166136261;

		for (const number of numbers) {
			hash ^= number | 0;
			hash = Math.imul(hash, 16777619);
		}

		return hash >>> 0;
	}

	static hash(...values) {
		let hash = 2166136261;

		const writeString = (string) => {
			for (let i = 0; i < string.length; i++) {
				hash ^= string.charCodeAt(i);
				hash = Math.imul(hash, 16777619);
			}
		};

		const write = (value) => {
			if (value === null) {
				writeString("null");
				return;
			}

			switch (typeof value) {
				case "undefined":
					writeString("undefined");
					break;

				case "boolean":
					writeString(value ? "boolean:true" : "boolean:false");
					break;

				case "number":
					writeString(`number:${value}`);
					break;

				case "bigint":
					writeString(`bigint:${value}`);
					break;

				case "string":
					writeString(`string:${value}`);
					break;

				case "object":
					if (Array.isArray(value)) {
						writeString("array:[");

						for (const item of value) {
							write(item);
							writeString(",");
						}

						writeString("]");
						break;
					}

					writeString("object:{");

					const keys = Object.keys(value).sort();

					for (const key of keys) {
						writeString(key);
						writeString(":");
						write(value[key]);
						writeString(",");
					}

					writeString("}");
					break;

				default:
					throw new TypeError(`Cannot hash value of type "${typeof value}".`);
			}
		};

		for (const value of values) {
			write(value);
			writeString("|");
		}

		return hash >>> 0;
	}
}
