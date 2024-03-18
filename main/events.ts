import { messagingApi, webhook } from '@line/bot-sdk';
import { RequestHandler } from 'express';

export class EventHandler {
    client: messagingApi.MessagingApiClient;

    constructor(private readonly channelAccessToken: string) {
        this.client = new messagingApi.MessagingApiClient({
            channelAccessToken,
        });
    }

    middleware(): RequestHandler {
        return async (req, res) => {
            const callbackRequest: webhook.CallbackRequest = req.body;
            try {
                const results = await Promise.all(
                    callbackRequest.events.map((event) => this.handle(event)),
                );
                return res.status(200).json({
                    status: 'success',
                    results,
                });
            } catch (e) {
                return res.status(500).json({
                    status: 'error',
                });
            }
        };
    }

    private async handle(event: webhook.Event) {
        if (isTextMessageEvent(event)) {
            if (event.message.text == '/ping') {
                const start = performance.now();
                await this.client.getWebhookEndpoint();
                const end = performance.now();
                await this.client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [
                        {
                            type: 'text',
                            text: `Ping: ${Math.floor(end - start)} ms`,
                        },
                    ],
                });
            }
        }
    }
}

// TODO: SDK にやらせる PR を作成?
function isTextMessageEvent(event: any): event is webhook.MessageEvent & {
    message: webhook.TextMessageContent;
} & {
    replyToken: string;
} {
    return (
        event.type === 'message' &&
        event.message &&
        event.message.type === 'text'
    );
}
