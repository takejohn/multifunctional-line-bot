import * as readline from 'readline/promises';
import { createAssertionSigningKey } from 'common/token/kid';
import { Interaction } from 'common/token/interaction';
import { generateJwt } from 'common/token/jwt';
import { issueChannelAccessTokenV2_1 } from 'common/token/api';
import { database } from 'common';

class CliInteraction implements Interaction {
    private readonly rl = readline.createInterface(
        process.stdin,
        process.stdout,
    );

    async getKid(publicKeyString: string): Promise<string> {
        console.log(
            'LINE Developers コンソール (https://developers.line.biz/console/) に公開鍵を登録し、取得した kid を入力してください。',
        );
        console.log(`=== 公開鍵===\n${publicKeyString}\n=== 公開鍵終わり ===`);
        return await this.rl.question('> ');
    }

    async getChannelId(): Promise<string> {
        console.log(
            'LINE Developers コンソール (https://developers.line.biz/console/) で取得したチャネル ID を入力してください。',
        );
        return await this.rl.question('> ');
    }

    close() {
        this.rl.close();
    }
}

(async function () {
    const interaction = new CliInteraction();
    const clientAssertionSigningKey =
        await createAssertionSigningKey(interaction);
    const clientAssertion = String(
        await generateJwt(interaction, clientAssertionSigningKey),
    );
    const token = await issueChannelAccessTokenV2_1(clientAssertion);
    console.log(token);
    interaction.close();
    await database.close();
})();
