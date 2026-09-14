export const Axis = /** @type {const} */ ({
	x: "x",
	z: "z",
	/**
	 * Given an axis, returns the other axis.
	 * @param {"x"|"z"} axis
	 */
	other: (axis) => {
		if (axis === Axis.x) {
			return Axis.z;
		} else if (axis === Axis.z) {
			return Axis.x;
		} else {
			throw new Error(`Invalid axis: ${axis}`);
		}
	}
});
