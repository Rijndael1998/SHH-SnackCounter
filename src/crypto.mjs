import Crypto from "node:crypto";
import aesjs from "aes-js";
import dgram from "dgram";

/**
 * Function hashing using PBKDF2-SHA512. {@link https://nodejs.org/api/crypto.html#crypto_crypto_pbkdf2_password_salt_iterations_keylen_digest_callback}
 * @param iterations time costs
 * @param salt salt
 * @param keySize key size to return
 * @param password password to hash
 * @returns a PBKDF2-SHA512 hash. 
 */
export function hashPBKDF2(salt, keySize, password) {
    const iterations = 1_200_000;
    return Uint8Array.from(Crypto.pbkdf2Sync(password, salt, iterations, keySize, "sha512"));
}


/**
 * Encrypt data with key and iv. This function also padds the data to make it fit within 16 bytes. 
 * @param key key to encrypt with
 * @param iv iv to encrypt with
 * @param data data to encrypt
 * @returns encrypted data
 */
export function encryptAES(key, iv, data) {
    if (data.length == 0) throw "Data is empty...";

    // add padding to data (at least 16 is added for the sake of consistancy)
    let paddingRequired = 16 + (16 - (data.length % 16)) - 1;
    let randomBytes = getRandomBytes(paddingRequired);

    // make data something i can work with...
    let numberArray = Array.from(data);

    for (let index = 0; index < randomBytes.length; index++) {
        numberArray.push(randomBytes[index]);
    }

    // add length...
    numberArray.push(paddingRequired);

    //convert back
    data = Uint8Array.from(numberArray);

    // must be block of 16 after conversion...
    let aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    return aesCbc.encrypt(data);
}

/**
 * Decrypt encrypted data with key and iv. This function also removes the pad added to the data to make it fit within 16 bytes. 
 * @param key key to decrypt with
 * @param iv iv to decrypt with
 * @param data data to decrypt
 * @returns decrypted data
 */
export function decryptAES(key, iv, encryptedData) {
    let aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    let decryptedData = Uint8Array.from(aesCbc.decrypt(encryptedData));

    // remove padding
    let paddingRequired = decryptedData[decryptedData.length - 1];
    return decryptedData.subarray(0, decryptedData.length - paddingRequired - 1);
}

/**
 * Generates random bytes
 * @param length how many bytes to generate
 * @returns an array of random bytes the size specified.  
 */
export function getRandomBytes(length) {
    return Crypto.randomBytes(length);
}

/**
 * Fast hash with SHA512
 * @param data data to hash
 * @returns hashed representation
 */
export function hash(data) {
    let hashElement = Crypto.createHash("sha512", data);
    hashElement.update(data);
    return Uint8Array.from(hashElement.digest());
}

export class UDPEncryptedTransport {
    constructor(dest, port, key, listen = false, type = "udp4") {
        this.dest = dest;
        this.port = port;

        this.key = key;
        this.iv = this.genIV();

        this.ts = dgram.createSocket(type);
        this.ts.on("message", (d, e) => this.processData(d, e));

        this.dataListener = (d, e) => { };
        this.prefilter = this.decryptSendData;

        if (listen)
            this.ts.bind(port, "0.0.0.0");
    }

    genIV() {
        const bytes = getRandomBytes(16)
        this.iv = bytes;
        return bytes;
    }

    rawSend(data) {
        this.ts.send(data, 0, data.length, this.port, this.dest);
    }

    // this will not update iv
    send(data) {
        const workedData = Buffer.from(data);
        const encryptedData = encryptAES(this.key, 0, workedData);
        this.rawSend(encryptedData);
    }

    // this will update iv
    sendAsJson(data) {
        const encodedData = Buffer.from(data);
        const encryptedData = Buffer.from(encryptAES(this.key, this.iv, encodedData)).toString("base64");
        const encodedIV = Buffer.from(this.iv).toString("base64");
        const frame = `${encodedIV},${encryptedData}`;

        this.rawSend(frame);
        this.genIV(); // fuck order
    }

    decryptSendData(d) {
        return decryptAES(this.key, 0, d);
    }

    decryptSendJSONData(d) {
        const [iv, encryptedData] = Buffer.from(d).toString().split(",");
        return decryptAES(this.key, Buffer.from(iv, "base64"), Buffer.from(encryptedData, "base64"));
    }

    processData(d, e) {
        this.dataListener(this.prefilter(d), e);
    }
}