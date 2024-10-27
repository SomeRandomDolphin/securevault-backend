import crypto from "crypto";

const algorithms = {
  'AES': { 
    ivLength: 16, 
    keyLength: 32,
    cipherName: 'aes-256-cbc'
  },
  'RC4': { 
    ivLength: 0, 
    keyLength: 16,
    cipherName: 'rc4'
  },
  'DES': { 
    ivLength: 8, 
    keyLength: 8,
    cipherName: 'des-cbc'
  }
};

export type EncryptionMethod = keyof typeof algorithms;

function deriveKey(key: string, salt: string, keyLength: number): Buffer {
  return crypto.scryptSync(key, salt, keyLength, {
    N: 16384,  // Cost factor
    r: 8,      // Block size
    p: 1       // Parallelization
  });
}

export const encryptData = (
  data: Buffer,
  encryptionKey: string,
  method: EncryptionMethod
): Buffer => {
  try {
    const algo = algorithms[method];
    if (!algo) {
      throw new Error(`Unsupported encryption method: ${method}`);
    }

    const salt = crypto.randomBytes(16);
    const key = deriveKey(encryptionKey, salt.toString('hex'), algo.keyLength);
    
    const iv = algo.ivLength > 0 ? crypto.randomBytes(algo.ivLength) : Buffer.alloc(0);
    
    const cipher = crypto.createCipheriv(
      algo.cipherName, 
      key, 
      algo.ivLength > 0 ? iv : ''
    );
    
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);

    return Buffer.concat([salt, iv, encrypted]);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

export const decryptData = (
  encryptedData: Buffer,
  encryptionKey: string,
  method: EncryptionMethod
): Buffer => {
  try {
    const algo = algorithms[method];
    if (!algo) {
      throw new Error(`Unsupported encryption method: ${method}`);
    }

    const saltLength = 16;
    const ivLength = algo.ivLength;
    
    if (encryptedData.length <= saltLength + ivLength) {
      throw new Error('Encrypted data is too short');
    }

    const salt = encryptedData.slice(0, saltLength);
    const iv = encryptedData.slice(saltLength, saltLength + ivLength);
    const data = encryptedData.slice(saltLength + ivLength);

    const key = deriveKey(encryptionKey, salt.toString('hex'), algo.keyLength);
    
    const decipher = crypto.createDecipheriv(
      algo.cipherName, 
      key, 
      algo.ivLength > 0 ? iv : ''
    );

    return Buffer.concat([
      decipher.update(data),
      decipher.final()
    ]);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

export const supportedAlgorithms = Object.keys(algorithms) as EncryptionMethod[];