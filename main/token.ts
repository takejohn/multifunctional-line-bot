import { channelAccessToken } from '@line/bot-sdk';
import { database, token } from 'common';

export interface TokenManagerOptions {
    /** jwtExpirationTime 秒単位での JWT の有効期間 (最大 1800 秒) */
    jwtExpirationTime?: number;

    apiBaseURL?: string;
}

async function getStaticChannelInfo() {
    const info = await database.getStaticChannelInfo();
    if (info == null) {
        throw new Error('チャネルの情報が設定されていません');
    }
    return info;
}

const staticChannelInfoPromise = getStaticChannelInfo();

export class TokenManager {
    private readonly jwtExpirationTime: number;

    private readonly channelAccessTokenClient: channelAccessToken.ChannelAccessTokenClient;

    constructor(options?: TokenManagerOptions) {
        this.jwtExpirationTime = options?.jwtExpirationTime ?? 10;
        this.channelAccessTokenClient =
            new channelAccessToken.ChannelAccessTokenClient({
                baseURL: options?.apiBaseURL ?? 'https://api.line.me',
            });
    }

    async issueToken(
        expirationTime: number,
    ): Promise<channelAccessToken.IssueChannelAccessTokenResponse> {
        const { channel_id, private_key, kid } = await staticChannelInfoPromise;
        const jwt = await token.generateJwt(
            channel_id,
            {
                privateKey: private_key,
                kid,
            },
            this.jwtExpirationTime,
            expirationTime,
        );
        return await this.channelAccessTokenClient.issueChannelTokenByJWT(
            'client_credentials',
            'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            jwt,
        );
    }
}
