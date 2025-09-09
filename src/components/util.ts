export type GenericCallback = (() => void) | undefined;

export const Duplicate2DArray = <T>(array: Array<Array<T>>) => {
    return [...array.map((item) => [...item])];
}

export const CopyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
}

export const ChooseRandomElement = <T>(array: Array<T>) => {
    return array[Math.floor(Math.random() * array.length)];
}

export function FormatUKMoney(num: number) {
    if (!Number.isFinite(num)) {
        throw new TypeError('Value must be a finite number');
    }
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP' // £
    }).format(num);
}