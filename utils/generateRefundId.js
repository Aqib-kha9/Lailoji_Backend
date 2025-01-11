export function generateRefundId() {
    const prefix = 'REF';
    const timestamp = Date.now(); // Get current timestamp
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit random number
    return `${prefix}-${timestamp}-${randomNumber}`;
}
