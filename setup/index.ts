import * as readline from 'readline/promises';
import { createAssertionSigningKey } from 'common/token/kid';
import { database } from 'common';

async function getKid(
    rl: readline.Interface,
    publicKeyString: string,
): Promise<string> {
    console.log(
        'LINE Developers コンソール (https://developers.line.biz/console/) に公開鍵を登録し、取得した kid を入力してください。',
    );
    console.log(`=== 公開鍵===\n${publicKeyString}\n=== 公開鍵終わり ===`);
    return await rl.question('> ');
}

async function getChannelId(rl: readline.Interface): Promise<string> {
    console.log(
        'LINE Developers コンソール (https://developers.line.biz/console/) で取得したチャネル ID を入力してください。',
    );
    return await rl.question('> ');
}

export async function main() {
    const rl = readline.createInterface(process.stdin, process.stdout);
    const { privateKey, kid } = await createAssertionSigningKey(
        async (publicKeyString) => await getKid(rl, publicKeyString),
    );
    await database.setStaticChannelInfo({
        channel_id: await getChannelId(rl),
        private_key: privateKey,
        kid,
    });
    await database.close();
    rl.close();
}
