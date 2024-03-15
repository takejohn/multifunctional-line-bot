import { channelAccessToken } from '@line/bot-sdk';
import { database, token } from 'common';

export interface TokenManagerOptions {
    /** 秒単位での JWT の有効期間 (最大 1800 秒) */
    jwtExpirationTime?: number;

    /** 秒単位でのチャネルアクセストークンの有効期間 (最大 30 日) */
    tokenExpirationTime?: number;

    apiBaseURL?: string;
}

async function getStaticChannelInfo() {
    const info = await database.getStaticChannelInfo();
    if (info == null) {
        throw new Error('チャネルの情報が設定されていません');
    }
    return info;
}

export interface KeyTokenPair {
    keyId: string;
    accessToken: string;
}

export class TokenManager {
    private readonly staticChannelInfoPromise = getStaticChannelInfo();

    private readonly jwtExpirationTime: number;

    private readonly tokenExpirationTime: number;

    private readonly channelAccessTokenClient: channelAccessToken.ChannelAccessTokenClient;

    constructor(options?: TokenManagerOptions) {
        this.jwtExpirationTime = options?.jwtExpirationTime ?? 10;
        this.tokenExpirationTime =
            options?.tokenExpirationTime ?? 60 * 60 * 24 * 2;
        this.channelAccessTokenClient =
            new channelAccessToken.ChannelAccessTokenClient({
                baseURL: options?.apiBaseURL ?? 'https://api.line.me',
            });
    }

    async getChannelId() {
        return (await this.staticChannelInfoPromise).channel_id;
    }

    async getChannelSecret() {
        return (await this.staticChannelInfoPromise).channel_secret;
    }

    async issueToken(): Promise<channelAccessToken.IssueChannelAccessTokenResponse> {
        const res = (await this.channelAccessTokenClient.issueChannelTokenByJWT(
            'client_credentials',
            'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            await this.generateJwt(),
        )) as object as {
            access_token: string;
            token_type: 'Bearer';
            expires_in: number;
            key_id: string;
        }; // TODO: open SDK (ChannelAccessTokenClient#issueChannelTokenByJWT) issue
        return {
            accessToken: res.access_token,
            tokenType: res.token_type,
            expiresIn: res.expires_in,
            keyId: res.key_id,
        };
    }

    async revokeToken(token: KeyTokenPair): Promise<boolean> {
        const jwt = await this.generateJwt();
        const client = this.channelAccessTokenClient;
        const kidsRes = await fetch(
            'https://api.line.me/oauth2/v2.1/tokens/kid?' +
                new URLSearchParams({
                    client_assertion_type:
                        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
                    client_assertion: jwt,
                }),
        );
        const data: { kids: string[] } = await kidsRes.json(); // TODO: open SDK (ChannelAccessToken#getAllValidChannelQAccessTokenKeyIds) issue
        if (!data.kids.includes(token.keyId)) {
            return false;
        }
        const revokeRes = await fetch(
            'https://api.line.me/oauth2/v2.1/revoke',
            {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: await this.getChannelId(),
                    client_secret: await this.getChannelSecret(),
                    access_token: token.accessToken,
                }),
            },
        ); // TODO: open SDK (ChannelAccessToken#getAllValidChannelQAccessTokenKeyIds) issue
        return true;
    }

    private async generateJwt() {
        const { channel_id, private_key, kid } =
            await this.staticChannelInfoPromise;
        return await token.generateJwt(
            channel_id,
            {
                privateKey: private_key,
                kid,
            },
            this.jwtExpirationTime,
            this.tokenExpirationTime,
        );
    }
}
