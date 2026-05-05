export const AuthService = {
    bufferToHex(buffer) {
        return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
    },
    hexToBuffer(hex) {
        const buffer = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            buffer[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return buffer.buffer;
    },
    async hashPassword(password) {
        try {
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const encoder = new TextEncoder();
            const keyMaterial = await window.crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
            const hashBuffer = await window.crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
            return `${this.bufferToHex(salt)}:${this.bufferToHex(hashBuffer)}`;
        } catch (error) {
            console.error("Hashing error:", error);
            return null;
        }
    },
    async verifyPassword(password, storedHash) {
        try {
            const [saltHex, hashHex] = storedHash.split(':');
            if (!saltHex || !hashHex) return false;
            const salt = this.hexToBuffer(saltHex);
            const encoder = new TextEncoder();
            const keyMaterial = await window.crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
            const hashBuffer = await window.crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
            return this.bufferToHex(hashBuffer) === hashHex;
        } catch (error) {
            console.error("Verification error:", error);
            return false;
        }
    }
};
