// Helper function for clarity
export const secondsFromNow = (seconds: number): bigint => {
    return BigInt(Math.floor(Date.now() / 1000 + seconds));
}
export const secondsAgo = (seconds: number): bigint => {
     return BigInt(Math.floor(Date.now() / 1000 - seconds));
}

export const getExpected = (all: string[], recipient: string): string[] => all.filter(p => p !== recipient);