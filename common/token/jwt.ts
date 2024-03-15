import { JWS } from 'node-jose';
import { AssertionSigningKey } from './kid';

interface Header {
    alg: string;
    typ: string;
    kid: string;
}

interface Payload {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    token_exp: number;
}

/**
 * @param channelId チャネル ID
 * @param exp 秒単位での JWT の有効期間 (最大 30 分)
 * @param tokenExp 秒単位でのチャネルアクセストークンの有効期間 (最大 30 日)
 * @returns
 */
export async function generateJwt(
    channelId: string,
    { privateKey, kid }: AssertionSigningKey,
    exp: number,
    tokenExp: number,
): Promise<string> {
    const header = createHeader(kid);
    const now = Math.floor(Date.now() / 1000);
    const payload = createPayload(channelId, now, exp, tokenExp);
    return await createSignature(header, payload, privateKey);
}

function createHeader(kid: string): Header {
    return {
        alg: 'RS256',
        typ: 'JWT',
        kid,
    };
}

function createPayload(
    channelId: string,
    now: number,
    exp: number,
    tokenExp: number,
): Payload {
    return {
        iss: channelId,
        sub: channelId,
        aud: 'https://api.line.me/',
        exp: now + exp,
        token_exp: tokenExp,
    };
}

async function createSignature(
    header: Header,
    payload: Payload,
    privateKeyString: string,
) {
    return String(
        await JWS.createSign(
            {
                format: 'compact',
                fields: header,
            },
            JSON.parse(privateKeyString),
        )
            .update(JSON.stringify(payload))
            .final(),
    );
}
