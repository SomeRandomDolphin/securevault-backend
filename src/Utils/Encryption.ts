import crypto from "crypto";

const algorithms = [
  { name: "aes-256-cbc", ivLength: 16, keyLength: 32 },
  { name: "rc4", ivLength: 0, keyLength: 16 },
  { name: "des-cbc", ivLength: 8, keyLength: 8 },
];

function deriveKey(password: string, salt: string, keyLength: number): Buffer {
  return crypto.scryptSync(password, salt, keyLength);
}

export const encryptData = (data: Buffer, password: string): Buffer => {
  let encryptedData = data;
  const metaData: Buffer[] = [];

  algorithms.forEach((algo) => {
    const salt = crypto.randomBytes(16);
    const key = deriveKey(password, salt.toString("hex"), algo.keyLength);
    const iv =
      algo.ivLength > 0 ? crypto.randomBytes(algo.ivLength) : Buffer.alloc(0);
    const cipher = crypto.createCipheriv(algo.name, key, iv);
    encryptedData = Buffer.concat([
      cipher.update(encryptedData),
      cipher.final(),
    ]);
    metaData.push(Buffer.concat([salt, iv]));
  });

  const finalData = Buffer.concat([
    Buffer.concat(metaData.reverse()),
    encryptedData,
  ]);
  return finalData;
};

export const decryptData = (
  encryptedData: Buffer,
  password: string,
): Buffer => {
  let data = encryptedData;
  let offset = 0;

  const totalMetadataLength = algorithms.reduce(
    (sum, algo) => sum + 16 + algo.ivLength,
    0,
  );
  if (data.length <= totalMetadataLength) {
    throw new Error(
      `Encrypted data is too short. Length: ${data.length}, Expected: > ${totalMetadataLength}`,
    );
  }

  const metaData = data.slice(0, totalMetadataLength);
  data = data.slice(totalMetadataLength);

  for (let i = algorithms.length - 1; i >= 0; i--) {
    const algo = algorithms[i];
    const saltLength = 16;
    const totalLength = saltLength + algo.ivLength;

    const salt = metaData.slice(offset, offset + saltLength);
    const iv =
      algo.ivLength > 0
        ? metaData.slice(offset + saltLength, offset + totalLength)
        : Buffer.alloc(0);
    offset += totalLength;

    const key = deriveKey(password, salt.toString("hex"), algo.keyLength);
    const decipher = crypto.createDecipheriv(algo.name, key, iv);

    try {
      data = Buffer.concat([decipher.update(data), decipher.final()]);
    } catch (error) {
      throw new Error(
        `Decryption failed for algorithm ${algo.name}: ${error.message}`,
      );
    }
  }

  return data;
};

export const algorithmNames = algorithms.map((algo) => algo.name);
