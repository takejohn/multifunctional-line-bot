import { TokenManager } from './token';

export async function main(): Promise<void> {
    const accessManager = new TokenManager();
    console.log(await accessManager.issueToken(10));
}
