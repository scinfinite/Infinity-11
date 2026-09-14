import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export interface ObjectStorageProvider {
  put(key: string, data: Uint8Array, contentType?: string): Promise<{ key: string; etag: string }>;
  get(key: string): Promise<Uint8Array | undefined>;
  delete(key: string): Promise<void>;
}

const safeKey = (key: string) => {
  const normalized = key.replaceAll('\\', '/').replace(/^\/+/, '');
  if (!normalized || normalized.split('/').some((part) => part === '..' || part === '.'))
    throw new Error('INVALID_STORAGE_KEY');
  return normalized;
};

export class FileObjectStorage implements ObjectStorageProvider {
  private readonly root: string;
  constructor(root: string) {
    this.root = resolve(root);
  }
  async put(
    key: string,
    data: Uint8Array,
    _contentType?: string,
  ): Promise<{ key: string; etag: string }> {
    const safe = safeKey(key);
    const path = join(this.root, safe);
    if (!path.startsWith(`${this.root}/`) && path !== this.root)
      throw new Error('INVALID_STORAGE_KEY');
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
    return { key: safe, etag: createHash('sha256').update(data).digest('hex') };
  }
  async get(key: string): Promise<Uint8Array | undefined> {
    try {
      return await readFile(join(this.root, safeKey(key)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
  }
  async delete(key: string): Promise<void> {
    await rm(join(this.root, safeKey(key)), { force: true });
  }
}
