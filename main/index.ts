import { middleware, webhook } from '@line/bot-sdk';
import express from 'express';
import { KeyTokenPair, TokenManager } from './token';
import { Server } from 'http';
import { EventHandler } from './events';

interface Context {
    server: Server;
    tokenManager: TokenManager;
    token: KeyTokenPair;
}

let closed = false;

export async function main(): Promise<void> {
    const tokenManager = new TokenManager();
    const token = await tokenManager.issueToken();
    const lineMiddleware = middleware({
        channelAccessToken: token.accessToken,
        channelSecret: await tokenManager.getChannelSecret(),
    });
    const app = express();
    const eventHandler = new EventHandler(token.accessToken);
    app.post('/webhook', lineMiddleware, eventHandler.middleware());
    const port = 45110;
    const server = app.listen(port);
    const context: Context = { server, tokenManager, token };
    console.log(`ポート ${port} で待ち受けを開始しました`);
    await new Promise((resolve, reject) => {
        process.on('SIGINT', () => close(context).then(resolve, reject));
    });
}

async function close({ server, tokenManager, token }: Context): Promise<void> {
    await tokenManager.revokeToken(token);
    console.log('サーバーを終了します');
    await new Promise<void>((resolve, reject) => {
        server.close((err) => {
            if (err == null) {
                console.log('サーバーを終了しました');
                resolve();
            } else {
                reject(err);
            }
        });
    });
}
