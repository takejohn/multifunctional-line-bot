import { JWS } from 'node-jose';
import { Interaction } from './interaction';
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

export async function generateJwt(interaction: Interaction, { privateKey, kid } : AssertionSigningKey) {
    const header = createHeader(kid);
    const payload = createPayload(await interaction.getChannelId());
    return await createSignature(header, payload, privateKey);
}

function createHeader(kid: string): Header {
    return {
        alg: 'RS256',
        typ: 'JWT',
        kid
    };
}

function createPayload(channelId: string): Payload {
    return {
        iss: channelId,
        sub: channelId,
        aud: 'https://api.line.me/',
        exp: Math.floor(new Date().getTime() / 1000) + 60 * 30,
        token_exp: 60,  // TODO: 有効期間を設定できるように
    };
}

async function createSignature(header: Header, payload: Payload, privateKeyString: string) {
    return await JWS.createSign({
        format: 'compact',
        fields: header
    }, JSON.parse(privateKeyString))
        .update(JSON.stringify(payload))
        .final()
}
