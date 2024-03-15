export interface ChannelAccessTokenV2_1 {
    /** チャネルアクセストークン */
    readonly access_token: string;

    /** チャネルアクセストークンが発行されてから有効期限が切れるまでの秒数 */
    readonly expires_in: number;

    readonly token_type: 'Bearer';

    /** チャネルアクセストークンを識別するための一意のキーID */
    readonly key_id: string;
}

interface BadRequestErrorData {
    readonly error: string;

    readonly error_description: string;
}

export class BadRequestError extends Error implements BadRequestErrorData {
    readonly error: string;

    readonly error_description: string;

    static {
        BadRequestError.prototype.name = 'BadRequestError';
    }

    public constructor({ error, error_description }: BadRequestErrorData) {
        super(error);
        this.error = error;
        this.error_description = error_description;
    }
}

export async function issueChannelAccessTokenV2_1(
    clientAssertion: string,
): Promise<ChannelAccessTokenV2_1> {
    const res = await fetch('https://api.line.me/oauth2/v2.1/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_assertion_type:
                'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            client_assertion: clientAssertion,
        }),
    });
    if (!res.ok) {
        throw new BadRequestError(await res.json());
    }
    return await res.json();
}
