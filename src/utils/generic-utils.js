/**
 * This merges two arrays together, filling in the missing values
 * in the first array with values from the second array.
 *
 * @param {array} a - The first array
 * @param {array} b - The second array
 * @returns {array} - The merged array
 */
export function zipArrays(a, b) {
    const length = Math.max(a.length, b.length);
    const result = new Array(length);

    for (let i = 0; i < length; i++) {
        result[i] = i < a.length ? a[i] : b[i];
    }

    return result;
}
