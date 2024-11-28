import crypto from "crypto";
import { CustomError } from "../Utils/ErrorHandling";
import { StatusCodes } from "http-status-codes";
import { decryptPrivateKey } from "../Utils/KeyManagement";

export class PDFSigner {
  private static SIGNATURE_LENGTH = 1024;

  private static debugBuffer(buffer: Buffer, label: string) {
    console.log(`\n=== ${label} ===`);
    console.log("Length:", buffer.length);
    console.log(
      "Hash:",
      crypto.createHash("sha256").update(buffer).digest("hex"),
    );
  }

  private static findSignatureLocations(pdfBuffer: Buffer): {
    byteRangePlaceholder: number;
    contentsPlaceholder: number;
  } {
    const pdfString = pdfBuffer.toString("binary");
    const typeSigPos = pdfString.lastIndexOf("/Type /Sig");
    if (typeSigPos === -1) throw new Error("Signature dictionary not found");

    const searchRange = pdfString.slice(typeSigPos, typeSigPos + 1000);
    const byteRangePos = searchRange.indexOf("/ByteRange");
    const contentsPos = searchRange.indexOf("/Contents");

    if (byteRangePos === -1)
      throw new Error("ByteRange not found in signature dictionary");
    if (contentsPos === -1)
      throw new Error("Contents not found in signature dictionary");

    const contentsHexStart = searchRange.indexOf("<", contentsPos);
    if (contentsHexStart === -1)
      throw new Error("Contents opening delimiter not found");

    return {
      byteRangePlaceholder: typeSigPos + byteRangePos + "/ByteRange".length,
      contentsPlaceholder: typeSigPos + contentsHexStart + 1,
    };
  }

  private static getContentToSign(
    pdfBuffer: Buffer,
    byteRanges: number[],
  ): Buffer {
    const firstPart = pdfBuffer.slice(byteRanges[0], byteRanges[1]);
    const secondPart = pdfBuffer.slice(
      byteRanges[2],
      byteRanges[2] + byteRanges[3],
    );
    return Buffer.concat([firstPart, secondPart]);
  }

  private static createSignatureDictionary(timestamp: string): string {
    return (
      `/Type /Sig\n` +
      `/Filter /Adobe.PPKLite\n` +
      `/SubFilter /adbe.pkcs7.detached\n` +
      `/Name (SecureVault${Date.now()})\n` +
      `/ByteRange [0000000000 0000000000 0000000000 0000000000]\n` +
      `/Contents <${"0".repeat(this.SIGNATURE_LENGTH)}>\n` +
      `/SigningTime (D:${timestamp}Z)\n` +
      `/Reason (SecureVault Digital Signature)\n` +
      `/Location (Secure Storage)\n` +
      `/ContactInfo (Secure Document Storage System)`
    );
  }

  public static async signPDF(
    pdfBuffer: Buffer,
    privateKeyPem: string,
    password: string,
  ): Promise<Buffer> {
    try {
      console.log("\n=== Starting PDF signing process ===");
      const privateKey = decryptPrivateKey(privateKeyPem, password);

      // Step 1: Create initial PDF with placeholders
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0];
      const signatureDictionary = this.createSignatureDictionary(timestamp);
      const objNum = Math.floor(Math.random() * 1000000);
      const signatureObject = `\n${objNum} 0 obj\n<<\n${signatureDictionary}\n>>\nendobj\n`;

      // Create the PDF with placeholders
      const pdfString = pdfBuffer.toString("binary");
      const eofPos = pdfString.lastIndexOf("%%EOF");
      const preparedPdf = Buffer.concat([
        pdfBuffer.slice(0, eofPos),
        Buffer.from(signatureObject),
        Buffer.from("%%EOF\n"),
      ]);

      this.debugBuffer(preparedPdf, "Prepared PDF");

      // Step 2: Find locations and calculate ranges
      const { byteRangePlaceholder, contentsPlaceholder } =
        this.findSignatureLocations(preparedPdf);

      const byteRanges = [
        0,
        contentsPlaceholder,
        contentsPlaceholder + this.SIGNATURE_LENGTH + 2,
        preparedPdf.length - (contentsPlaceholder + this.SIGNATURE_LENGTH + 2),
      ];

      // Step 3: Create a copy for modification
      const finalPdf = Buffer.from(preparedPdf);

      // Step 4: Write the ByteRange
      const byteRangeString = ` [${byteRanges
        .map((n) => n.toString().padStart(10, "0"))
        .join(" ")}]`;
      finalPdf.write(byteRangeString, byteRangePlaceholder);

      // Step 5: Create content buffer for signing (from original)
      const contentToSign = this.getContentToSign(finalPdf, byteRanges);
      this.debugBuffer(contentToSign, "Content to Sign");

      // Step 6: Generate signature
      const signature = crypto.sign("sha256", contentToSign, {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      });
      this.debugBuffer(signature, "Generated Signature");

      // Step 7: Write signature
      const signatureHex = signature
        .toString("hex")
        .padEnd(this.SIGNATURE_LENGTH, "0");
      finalPdf.write(signatureHex, contentsPlaceholder);

      // Verify immediately
      const publicKey = crypto.createPublicKey(privateKey);
      const isValid = await this.verifySignature(
        finalPdf,
        publicKey.export({ type: "spki", format: "pem" }).toString(),
      );
      console.log("\nImmediate verification result:", isValid);

      return finalPdf;
    } catch (error) {
      console.error("Signing error:", error);
      throw new CustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to sign PDF: ${error.message}`,
      );
    }
  }

  public static async verifySignature(
    pdfBuffer: Buffer,
    publicKey: string,
  ): Promise<boolean> {
    try {
      console.log("\n=== Starting signature verification ===");
      this.debugBuffer(pdfBuffer, "PDF to Verify");

      const { byteRangePlaceholder, contentsPlaceholder } =
        this.findSignatureLocations(pdfBuffer);

      // Get ByteRange values
      const pdfString = pdfBuffer.toString("binary");
      const byteRangeStr = pdfString.slice(
        byteRangePlaceholder,
        byteRangePlaceholder + 50,
      );
      const byteRangeMatch = byteRangeStr.match(/\[([\d\s]+)\]/);

      if (!byteRangeMatch)
        throw new Error("Could not extract ByteRange values");
      const byteRanges = byteRangeMatch[1].trim().split(/\s+/).map(Number);
      console.log("ByteRange values:", byteRanges);

      // Extract signature
      const signatureHex = pdfBuffer
        .slice(contentsPlaceholder, contentsPlaceholder + this.SIGNATURE_LENGTH)
        .toString()
        .replace(/\s+/g, "")
        .replace(/0+$/, "");

      const signature = Buffer.from(signatureHex, "hex");
      this.debugBuffer(signature, "Extracted Signature");

      // Create verification buffer using same method as signing
      const contentToVerify = this.getContentToSign(pdfBuffer, byteRanges);
      this.debugBuffer(contentToVerify, "Content to Verify");

      // Verify
      return crypto.verify(
        "sha256",
        contentToVerify,
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        },
        signature,
      );
    } catch (error) {
      console.error("Verification failed:", error);
      throw new CustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to verify signature: ${error.message}`,
      );
    }
  }
}
