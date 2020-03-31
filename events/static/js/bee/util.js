// Random utility functions

export function countKeys(o) {
    let i = 0;
    for (let key in o) {
        i += 1;
    }
    return i;
}

export function getMeanOfArray(arr) {
    let sum = arr.reduce(function (a, b) { return a + b }, 0);
    return sum / (arr.length || 1);
}

export function getMinOfArray(arr) {
    let len = arr.length, min = Infinity;
    while (len--) {
        if (arr[len] < min) {
            min = arr[len];
        }
    }
    return min;
}

export function getMaxOfArray(arr) {
    let len = arr.length, max = -Infinity;
    while (len--) {
        if (arr[len] > max) {
            max = arr[len];
        }
    }
    return max;
}

export function getColorAtScalar(n, maxLength) {
    let value = 0;
    if (n <= maxLength) {
        value = (maxLength - n) / maxLength * 5 / 6; // remove magenta color
    }
    return value;
}
