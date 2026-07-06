/**
 * This merges two arrays together, filling in the missing values
 * in the first array with values from the second array.
 *
 * @param a - The first array
 * @param b - The second array
 * @returns The merged array
 */
export function zipArrays<T>(a: T[], b: T[]) {
    const length = Math.max(a.length, b.length);
    const result = new Array<T>(length);

    for (let i = 0; i < length; i++) {
        result[i] = i < a.length ? a[i] : b[i];
    }

    return result;
}
