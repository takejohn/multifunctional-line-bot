import { Database, RunResult, Statement } from 'sqlite3';

const db = new Database('database.db');

async function run(sql: string, params?: any): Promise<RunResult> {
    return resolvedWithThis((callback) => db.run(sql, params, callback));
}

async function get(sql: string, params?: any): Promise<any> {
    return resolvedWithArgument((callback) => db.get(sql, params, callback));
}

export async function close(): Promise<void> {
    return resolvedWithThis((callback) => db.close(callback));
}

export async function getPrivateKey(): Promise<string | undefined> {
    await run('CREATE TABLE IF NOT EXISTS private_key(value);');
    const row = await get('SELECT (value) FROM private_key;');
    return row?.value;
}

export async function insertPrivateKey(value: string) {
    if ((await getPrivateKey()) != null) {
        throw new Error('private key is already has been inserted');
    }
    await run('INSERT INTO private_key(value) VALUES(?)', [value]);
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
