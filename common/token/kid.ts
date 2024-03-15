export interface AssertionSigningKey {
    privateKey: string;
    kid: string;
}

interface KeyStringPair {
    publicKey: string;
    privateKey: string;
}

export async function createAssertionSigningKey(
    kidGetter: (publicKey: string) => Promise<string>,
): Promise<AssertionSigningKey> {
    const { publicKey, privateKey } = await generateKeyPair();
    const kid = await kidGetter(publicKey);
    const result = { privateKey, kid };
    return result;
}

async function generateKeyPair(): Promise<KeyStringPair> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['sign', 'verify'],
    );
    return {
        publicKey: await stringifyKey(keyPair.publicKey),
        privateKey: await stringifyKey(keyPair.privateKey),
    };
}

async function stringifyKey(key: CryptoKey) {
    return JSON.stringify(await crypto.subtle.exportKey('jwk', key));
}
