import { channelAccessToken } from '@line/bot-sdk';
import { database, token } from 'common';

export interface TokenManagerOptions {
    /** jwtExpirationTime 秒単位での JWT の有効期間 (最大 1800 秒) */
    jwtExpirationTime?: number;

    apiBaseURL?: string;
}

export class TokenManager {
    private readonly jwtExpirationTime: number;

    private readonly channelAccessTokenClient: channelAccessToken.ChannelAccessTokenClient;

    private staticChannelInfo: database.StaticChannelInfo | undefined;

    constructor(options?: TokenManagerOptions) {
        this.jwtExpirationTime = options?.jwtExpirationTime ?? 10;
        this.channelAccessTokenClient =
            new channelAccessToken.ChannelAccessTokenClient({
                baseURL: options?.apiBaseURL ?? 'https://api.line.me',
            });
    }

    private async getStaticChannelInfo() {
        const currentInfo = this.staticChannelInfo;
        if (currentInfo != null) {
            return currentInfo;
        }
        const newInfo = await database.getStaticChannelInfo();
        if (newInfo == null) {
            throw new Error('チャネルの情報が設定されていません');
        }
        this.staticChannelInfo = newInfo;
        return newInfo;
    }

    async issueToken(
        expirationTime: number,
    ): Promise<channelAccessToken.IssueChannelAccessTokenResponse> {
        const { channel_id, private_key, kid } =
            await this.getStaticChannelInfo();
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
