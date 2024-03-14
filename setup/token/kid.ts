import { Interaction } from './interaction';

export interface AssertionSigningKey {
    privateKey: string;
    kid: string;
}

interface KeyStringPair {
    publicKey: string;
    privateKey: string;
}

export async function createAssertionSigningKey(interaction: Interaction): Promise<AssertionSigningKey> {
    const { publicKey, privateKey } = await generateKeyPair();
    const kid = await interaction.getKid(publicKey);
    return { privateKey, kid };
}

async function generateKeyPair(): Promise<KeyStringPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );
    return {
        publicKey: await stringifyKey(keyPair.publicKey),
        privateKey: await stringifyKey(keyPair.privateKey),
    };
}

async function stringifyKey(key: CryptoKey) {
    return JSON.stringify(await crypto.subtle.exportKey("jwk", key));
}
