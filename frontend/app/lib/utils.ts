export const formatCurrency = (amount: bigint | undefined | null, decimals = 2): string => {
    if (typeof amount !== 'bigint') return "$0.00"; // Handle null/undefined
    const factor = BigInt(10 ** decimals);
    const integerPart = amount / factor;
    const fractionalPart = amount % factor;
    return `$${integerPart.toString()}.${fractionalPart.toString().padStart(decimals, '0')}`;
};

export const formatTimestamp = (timestamp: bigint | undefined | null): string => {
    if (typeof timestamp !== 'bigint') return 'N/A'; // Handle null/undefined
    try {
        const date = new Date(Number(timestamp) * 1000);
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