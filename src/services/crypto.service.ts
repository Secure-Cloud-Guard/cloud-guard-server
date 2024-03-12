import crypto from 'crypto';
import dotenv from 'dotenv';
import { ENCRYPTED_PART_SIZE_BYTES } from "../const/s3";

dotenv.config();

export class CryptoService {
  private key: Buffer;
  private iv: Buffer;
  private readonly algorithm = 'aes-256-cbc';

  constructor(key: string) {
    this.iv = Buffer.from(process.env.CRYPTO_IV as string, "hex");
    this.key = Buffer.from(key, 'hex');
  }

  encryptUrl(url: string): string {
    let urlParts = url.split('/');
    urlParts = urlParts.map(part => part !== '' ? this.encryptStr(part) : '');
    return urlParts.join('/');
  }

  decryptUrl(encryptedUrl: string): string {
    let urlParts = encryptedUrl.split('/');
    urlParts = urlParts.map(part => part !== '' ? this.decryptStr(part) : '');
    return urlParts.join('/');
  }

  encryptStr(str: string): string {
    const encoder = new TextEncoder();
    const buffer = Buffer.from(encoder.encode(str));
    const encryptedBuffer = this.encryptBuffer(buffer);

    return this.bufferToUrlSafeBase64(encryptedBuffer);
  }

  decryptStr(encryptedStr: string): string {
    const encryptedBuffer = this.urlSafeBase64ToBuffer(encryptedStr);
    const buffer = this.decryptBuffer(encryptedBuffer);

    return buffer.toString('utf8');
  }

  encryptBuffer(buffer: Buffer): Buffer {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    const encryptedBuffers = [cipher.update(buffer), cipher.final()];
    return Buffer.concat(encryptedBuffers);
  }

  decryptBuffer(buffer: Buffer): Buffer {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    const decryptedBuffers = [decipher.update(buffer), decipher.final()];
    return Buffer.concat(decryptedBuffers);
  }

  decryptBufferByChunks(encryptedBuffer: Buffer, chunkSize: number = ENCRYPTED_PART_SIZE_BYTES): Buffer {
    const bufferParts: Buffer[] = [];
    const totalChunks = encryptedBuffer?.byteLength > 0 ? encryptedBuffer?.byteLength / chunkSize : 1;

    for (let chunk = 0; chunk < totalChunks; chunk++) {
      let CHUNK = encryptedBuffer.slice(chunk * chunkSize, (chunk + 1) * chunkSize);
      bufferParts.push(this.decryptBuffer(CHUNK));
    }

    return Buffer.concat(bufferParts);
  }

  private bufferToUrlSafeBase64(buffer: Buffer): string {
    const bytes = new Uint8Array(buffer);
    let binaryString = '';

    for (let i = 0; i < bytes.byteLength; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }

    return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_');;
  }

  private urlSafeBase64ToBuffer(base64: string): Buffer {
    base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return Buffer.from(bytes);
  }
}