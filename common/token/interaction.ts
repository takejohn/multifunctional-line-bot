export interface Interaction {
    getKid(publicKeyString: string): Promise<string>;

    getChannelId(): Promise<string>;
}
