import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { env } from './env';

/**
 * Storage abstraction so the rest of the app never cares WHERE a file
 * physically lives. Swap the driver in .env (STORAGE_DRIVER=local|s3|cloudinary).
 *
 * SECURITY: `documents` (government ID / driving license / selfie) are
 * ALWAYS stored as private objects, regardless of driver — never a public
 * URL. `bikes` and `profiles` are public (safe to be publicly visible).
 * Document access always goes through getFileStream() below, which the
 * owner-or-admin-only /api/documents/file/:userId/:docType route uses
 * (see documentController.getDocumentFile) — never through a static/public URL.
 */

export interface StoredFile {
  url: string; // usable directly in <img src> ONLY for bikes/profiles; for documents this is a non-public marker, not a fetchable link
  key: string; // storage key/path, used to fetch/delete later
  driver: 'local' | 's3' | 'cloudinary';
}

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const isPrivateFolder = (folder: string) => folder === 'documents';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Lazily-constructed SDK clients (only created if that driver is selected,
// so `npm install` doesn't require AWS/Cloudinary credentials to boot).
// ---------------------------------------------------------------------------

let s3Client: import('@aws-sdk/client-s3').S3Client | null = null;
async function getS3Client() {
  if (!s3Client) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    s3Client = new S3Client({
      region: env.storage.aws.region,
      credentials: {
        accessKeyId: env.storage.aws.accessKeyId,
        secretAccessKey: env.storage.aws.secretAccessKey,
      },
    });
  }
  return s3Client;
}

let cloudinaryConfigured = false;
async function getCloudinary() {
  const { v2: cloudinary } = await import('cloudinary');
  if (!cloudinaryConfigured) {
    cloudinary.config({
      cloud_name: env.storage.cloudinary.cloudName,
      api_key: env.storage.cloudinary.apiKey,
      api_secret: env.storage.cloudinary.apiSecret,
    });
    cloudinaryConfigured = true;
  }
  return cloudinary;
}

// ---------------------------------------------------------------------------
// saveFile
// ---------------------------------------------------------------------------

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  folder: 'documents' | 'bikes' | 'profiles',
): Promise<StoredFile> {
  const ext = path.extname(originalName);
  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const key = `${folder}/${filename}`;
  const isPrivate = isPrivateFolder(folder);

  switch (env.storage.driver) {
    case 's3': {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await getS3Client();

      await client.send(
        new PutObjectCommand({
          Bucket: env.storage.aws.bucket,
          Key: key,
          Body: buffer,
          ContentType: guessContentType(ext),
          // No ACL is set here on purpose: modern S3 buckets have "Block
          // Public Access" on by default and reject ACL writes. For the
          // `bikes`/`profiles` prefixes, make them public via a BUCKET
          // POLICY (not an object ACL) in the AWS console — see README.
          // `documents/*` must NEVER be covered by that public policy.
        }),
      );

      const publicUrl = `https://${env.storage.aws.bucket}.s3.${env.storage.aws.region}.amazonaws.com/${key}`;
      return { url: isPrivate ? 'private' : publicUrl, key, driver: 's3' };
    }

    case 'cloudinary': {
      const cloudinary = await getCloudinary();
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: filename,
            resource_type: 'auto',
            // Private/authenticated delivery for documents: the file cannot
            // be fetched by URL without a signed link generated at request
            // time (see getFileStream below). Bikes/profiles upload as
            // normal public assets.
            type: isPrivate ? 'authenticated' : 'upload',
          },
          (err, result) => (err ? reject(err) : resolve(result)),
        );
        stream.end(buffer);
      });

      return {
        url: isPrivate ? 'private' : uploadResult.secure_url,
        key: uploadResult.public_id,
        driver: 'cloudinary',
      };
    }

    case 'local':
    default: {
      const dir = path.join(UPLOAD_ROOT, folder);
      ensureDir(dir);
      fs.writeFileSync(path.join(dir, filename), buffer);
      return { url: isPrivate ? 'private' : `/uploads/${key}`, key, driver: 'local' };
    }
  }
}

// ---------------------------------------------------------------------------
// getFileStream — the ONLY way document bytes are ever read back, used by
// the owner-or-admin-only route in documentController.getDocumentFile.
// ---------------------------------------------------------------------------

export type FileResult =
  | { type: 'stream'; stream: Readable; contentType?: string }
  | { type: 'redirect'; url: string };

export async function getFileStream(key: string): Promise<FileResult> {
  switch (env.storage.driver) {
    case 's3': {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await getS3Client();
      const result = await client.send(new GetObjectCommand({ Bucket: env.storage.aws.bucket, Key: key }));
      return { type: 'stream', stream: result.Body as Readable, contentType: result.ContentType };
    }

    case 'cloudinary': {
      const cloudinary = await getCloudinary();
      // Generates a short-lived signed URL for an `authenticated`-type asset.
      // The browser/admin client is redirected straight to Cloudinary, which
      // rejects the request without a valid signature — so the underlying
      // asset is never guessable/public.
      const signedUrl = cloudinary.url(key, {
        type: 'authenticated',
        sign_url: true,
        resource_type: 'auto',
      });
      return { type: 'redirect', url: signedUrl };
    }

    case 'local':
    default: {
      const filePath = path.join(UPLOAD_ROOT, key);
      if (!fs.existsSync(filePath)) throw new Error('File not found on disk.');
      return { type: 'stream', stream: fs.createReadStream(filePath) };
    }
  }
}

export async function deleteFile(key: string): Promise<void> {
  switch (env.storage.driver) {
    case 's3': {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await getS3Client();
      await client.send(new DeleteObjectCommand({ Bucket: env.storage.aws.bucket, Key: key }));
      return;
    }
    case 'cloudinary': {
      const cloudinary = await getCloudinary();
      await cloudinary.uploader.destroy(key, { resource_type: 'auto' });
      return;
    }
    case 'local':
    default: {
      const filePath = path.join(UPLOAD_ROOT, key);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
}

function guessContentType(ext: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}
