export const formatCurrency = (amount: bigint | undefined | null): string => {
    if (typeof amount !== 'bigint') return "$0.00"; // Handle null/undefined
    return `$${amount.toString()}.00`;
};

export const formatTimestamp = (timestamp: bigint | undefined | null): string => {
    if (typeof timestamp !== 'bigint') return 'N/A'; // Handle null/undefined
    try {
        const date = new Date(Number(timestamp));
        // Check if the date is valid after conversion
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        console.error("Error formatting timestamp:", e);
        return 'Error';
    }
};

export const truncateAddress = (address: string | null | undefined, start = 6, end = 4): string => {
    if (!address) return 'N/A'; // Handle null/undefined
    if (address.length <= start + end + 3) return address; // +3 for "..."
    return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
};

export function hexToUtf8(value: string): string {
    if (!value?.startsWith('0x')) return value;
    try {
        // Strip 0x, pair‑wise parse, and build a byte array
        const bytes = Uint8Array.from(
            value.slice(2).match(/.{1,2}/g)!.map(b => parseInt(b, 16))
        );
        return new TextDecoder().decode(bytes).replace(/\0+$/, ''); // trim nulls
    } catch {
        return value; // leave as‑is if decoding fails
    }
}
export const formatFrequency = (freq: bigint | undefined): string => {
    if (typeof freq !== 'bigint') return 'N/A';
    const seconds = Number(freq) / 1000;
    if (seconds === 604800) return 'Weekly';
    if (seconds === 1209600) return 'Bi-Weekly';
    if (seconds === 2592000) return 'Monthly';
    return `${seconds} seconds`; // Fallback
}