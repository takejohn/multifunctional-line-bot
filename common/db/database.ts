import { Database, RunResult } from 'sqlite3';

const db = new Database('database.db');

interface StaticChannelInfo {
    channel_id: string;
    private_key: string;
    kid: string;
}

interface ChannelAccessTokenRecord {
    access_token: string;

    /** 作成時刻 (秒単位の UNIX 時刻) */
    issue_date: number;

    /** 秒単位 */
    expires_in: number;
    key_id: number;
}

async function run(sql: string, params?: any): Promise<RunResult> {
    return resolvedWithThis((callback) => db.run(sql, params, callback));
}

async function get(sql: string, params?: any): Promise<any> {
    return resolvedWithArgument((callback) => db.get(sql, params, callback));
}

export async function close(): Promise<void> {
    return resolvedWithThis((callback) => db.close(callback));
}

async function createStaticChannelInfoTable(): Promise<void> {
    await run(`CREATE TABLE IF NOT EXISTS static_channel_info(
        channel_id TEXT,
        private_key TEXT,
        kid TEXT
    );`);
}

export async function getStaticChannelInfo(): Promise<
    StaticChannelInfo | undefined
> {
    await createChannelAccessTokenTable();
    return await get(
        'SELECT channel_id, private_key, kid FROM static_channel_info;',
    );
}

export async function setStaticChannelInfo(
    channel: StaticChannelInfo,
): Promise<void> {
    await createStaticChannelInfoTable();
    await run('DELETE FROM static_channel_info;');
    await run(
        'INSERT INTO static_channel_info(channel_id, private_key, kid) VALUES (?, ?, ?);',
        [channel.channel_id, channel.private_key, channel.kid],
    );
}

export async function getChannelAccessToken(): Promise<ChannelAccessTokenRecord> {
    await createChannelAccessTokenTable();
    return await get(`SELECT access_token, issue_date, expires_in, key_id
        FROM channel_access_token;`);
}

export async function updateChannelAccessToken(
    record: ChannelAccessTokenRecord,
) {
    await run(
        `INSERT OR REPLACE INTO channel_access_token(
            access_token,
            issue_date,
            expires_in,
            key_id
        ) VALUES (?, ?, ?, ?);`,
        [
            record.access_token,
            record.issue_date,
            record.expires_in,
            record.key_id,
        ],
    );
}

async function createChannelAccessTokenTable() {
    await run(`CREATE TABLE IF NOT EXISTS channel_access_token(
        access_token TEXT,
        issue_date INTEGER,
        expires_in INTEGER,
        key_id TEXT
    );`);
}

function resolvedWithThis<T>(
    executor: (callback: (this: T, err: Error | null) => void) => void,
): Promise<T> {
    return new Promise((resolve, reject) =>
        executor(function (err) {
            if (err == null) {
                resolve(this);
            } else {
                reject(err);
            }
        }),
    );
}

function resolvedWithArgument<T>(
    executor: (callback: (err: Error | null, value: T) => void) => void,
): Promise<T> {
    return new Promise((resolve, reject) =>
        executor(function (err, value) {
            if (err == null) {
                resolve(value);
            } else {
                reject(err);
            }
        }),
    );
}
