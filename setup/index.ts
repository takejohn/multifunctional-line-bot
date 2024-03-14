import { mkdir, writeFile } from 'fs/promises';
import * as readline from 'readline/promises'; 
import { createAssertionSigningKey } from './token/kid';
import { Interaction } from './token/interaction';
import { generateJwt } from './token/jwt';
import { issueChannelAccessTokenV2_1 } from './token/api';

class CliInteraction implements Interaction {
    private readonly rl = readline.createInterface(process.stdin, process.stdout);

    async getKid(publicKeyString: string): Promise<string> {
        console.log('LINE Developers コンソール (https://developers.line.biz/console/) に公開鍵を登録し、取得した kid を入力してください。');
        console.log(`=== 公開鍵===\n${publicKeyString}\n=== 公開鍵終わり ===`);
        return await this.rl.question('> ');
    }

    async getChannelId(): Promise<string> {
        console.log('LINE Developers コンソール (https://developers.line.biz/console/) で取得したチャネル ID を入力してください。');
        return await this.rl.question('> ');
    }

    close() {
        this.rl.close();
    }
}

(async function() {
    const interaction = new CliInteraction();
    const clientAssertionSigningKey = await createAssertionSigningKey(interaction);
    const clientAssertion = String(await generateJwt(interaction, clientAssertionSigningKey));
    const token = await issueChannelAccessTokenV2_1(clientAssertion);
    console.log(token);
    interaction.close();
})();

async function savePublicKey(publicKeyString: string) {
    await mkdir('./.secrets/', { recursive: true });
    await writeFile('./.secrets/public.key', publicKeyString);
}
