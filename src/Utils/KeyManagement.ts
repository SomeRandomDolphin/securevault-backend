import crypto from 'crypto';
import { promisify } from 'util';
import { CustomError } from "../Utils/ErrorHandling";
import { StatusCodes } from "http-status-codes";

const generateKeyPair = promisify(crypto.generateKeyPair);

export const generateKeyPairs = async (userPassword: string) => {
  const { publicKey, privateKey } = await generateKeyPair('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: userPassword
    }
  });
  
  return { publicKey, privateKey };
};

export const decryptPrivateKey = (encryptedPrivateKey: string, password: string): crypto.KeyObject => {
  try {
    if (!encryptedPrivateKey || !password) {
      throw new CustomError(
        StatusCodes.BAD_REQUEST,
        "Missing required parameters for key decryption"
      );
    }

    const privateKey = crypto.createPrivateKey({
      key: encryptedPrivateKey,
      format: 'pem',
      type: 'pkcs8',
      passphrase: password
    });

    if (!privateKey) {
      throw new CustomError(
        StatusCodes.UNAUTHORIZED,
        "Failed to decrypt private key"
      );
    }

    return privateKey;
  } catch (error) {
    if (error.message?.includes('bad password read')) {
      throw new CustomError(
        StatusCodes.UNAUTHORIZED,
        "Invalid password provided"
      );
    }
    
    throw new CustomError(
      StatusCodes.UNAUTHORIZED,
      `Failed to decrypt private key: ${error.message}`
    );
  }
};