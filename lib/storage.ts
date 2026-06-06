import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ensureMediaDirectories, safeJoin, unlinkIfPresent } from "@/lib/files";
import { CLIPS_DIR, toPublicClipUrl, toPublicUploadUrl, UPLOADS_DIR } from "@/lib/paths";

type StoredMedia = {
  fileName: string;
  objectKey: string;
  path: string | null;
  provider: string;
  url: string;
};

const MULTIPART_UPLOAD_THRESHOLD_BYTES = 100 * 1024 * 1024;
const MULTIPART_PART_SIZE_BYTES = 64 * 1024 * 1024;

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey || !process.env.R2_BUCKET) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function mediaUrl(objectKey: string, localUrl: string) {
  if (process.env.R2_PUBLIC_BASE_URL) {
    return `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey}`;
  }

  return getR2Client() ? `/api/media/${objectKey}` : localUrl;
}

export async function createDirectVideoUpload(
  extension: string,
  contentType: string,
  sizeBytes: number,
) {
  const client = getR2Client();

  if (!client) {
    return null;
  }

  const fileName = `${randomUUID()}${extension}`;
  const objectKey = `uploads/${fileName}`;

  if (sizeBytes > MULTIPART_UPLOAD_THRESHOLD_BYTES) {
    const multipartUpload = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: process.env.R2_BUCKET,
        Key: objectKey,
        ContentType: contentType || "application/octet-stream",
      }),
    );

    if (!multipartUpload.UploadId) {
      throw new Error("R2 did not create a multipart upload.");
    }

    const partCount = Math.ceil(sizeBytes / MULTIPART_PART_SIZE_BYTES);
    const parts = await Promise.all(
      Array.from({ length: partCount }, async (_, index) => {
        const partNumber = index + 1;
        const uploadUrl = await getSignedUrl(
          client,
          new UploadPartCommand({
            Bucket: process.env.R2_BUCKET,
            Key: objectKey,
            PartNumber: partNumber,
            UploadId: multipartUpload.UploadId,
          }),
          { expiresIn: 60 * 60 },
        );

        return { partNumber, uploadUrl };
      }),
    );

    return {
      fileName,
      mode: "multipart" as const,
      objectKey,
      partSize: MULTIPART_PART_SIZE_BYTES,
      parts,
      path: null,
      provider: "r2",
      uploadId: multipartUpload.UploadId,
      url: mediaUrl(objectKey, toPublicUploadUrl(fileName)),
    };
  }

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: objectKey,
      ContentType: contentType || "application/octet-stream",
    }),
    { expiresIn: 60 * 10 },
  );

  return {
    fileName,
    mode: "single" as const,
    objectKey,
    path: null,
    provider: "r2",
    uploadUrl,
    url: mediaUrl(objectKey, toPublicUploadUrl(fileName)),
  };
}

export async function completeMultipartVideoUpload({
  objectKey,
  parts,
  uploadId,
}: {
  objectKey: string;
  parts: Array<{ etag: string; partNumber: number }>;
  uploadId: string;
}) {
  const client = getR2Client();

  if (!client) {
    throw new Error("Cloudflare R2 storage is not configured.");
  }

  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET,
      Key: objectKey,
      MultipartUpload: {
        Parts: parts
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((part) => ({
            ETag: part.etag,
            PartNumber: part.partNumber,
          })),
      },
      UploadId: uploadId,
    }),
  );
}

export async function storeUploadedVideo(file: File, extension: string) {
  const fileName = `${randomUUID()}${extension}`;
  const objectKey = `uploads/${fileName}`;
  const localPath = safeJoin(UPLOADS_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  const client = getR2Client();

  if (client) {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      }),
    );

    return {
      fileName,
      objectKey,
      path: null,
      provider: "r2",
      url: mediaUrl(objectKey, toPublicUploadUrl(fileName)),
    } satisfies StoredMedia;
  }

  await ensureMediaDirectories();
  await writeFile(localPath, buffer);

  return {
    fileName,
    objectKey,
    path: localPath,
    provider: "local",
    url: toPublicUploadUrl(fileName),
  } satisfies StoredMedia;
}

export async function prepareClipOutput() {
  const fileName = `${randomUUID()}.mp4`;
  const objectKey = `clips/${fileName}`;
  const client = getR2Client();

  if (client) {
    const tempClipsDir = path.join(os.tmpdir(), "clip-farmer", "clips");
    await mkdir(tempClipsDir, { recursive: true });

    return {
      fileName,
      objectKey,
      outputPath: path.join(tempClipsDir, fileName),
      url: mediaUrl(objectKey, toPublicClipUrl(fileName)),
      provider: "r2",
    };
  }

  await ensureMediaDirectories();
  return {
    fileName,
    objectKey,
    outputPath: safeJoin(CLIPS_DIR, fileName),
    url: mediaUrl(objectKey, toPublicClipUrl(fileName)),
    provider: getR2Client() ? "r2" : "local",
  };
}

export async function finalizeRenderedClip(outputPath: string, objectKey: string) {
  const client = getR2Client();

  if (!client) {
    return;
  }

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: objectKey,
      Body: await readFile(outputPath),
      ContentType: "video/mp4",
    }),
  );

  await unlinkIfPresent(outputPath);
}

export async function deleteStoredMedia(input: {
  objectKey?: string | null;
  path?: string | null;
}) {
  await unlinkIfPresent(input.path);

  const client = getR2Client();
  if (!client || !input.objectKey) {
    return;
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: input.objectKey,
    }),
  );
}

export async function getSignedMediaUrl(objectKey: string) {
  const client = getR2Client();

  if (!client) {
    return `/${objectKey}`;
  }

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: objectKey,
    }),
    { expiresIn: 60 * 10 },
  );
}

export async function ensureLocalReadableMedia(input: {
  objectKey?: string | null;
  path?: string | null;
}) {
  if (input.path) {
    return input.path;
  }

  const client = getR2Client();
  if (!client || !input.objectKey) {
    return null;
  }

  const response = await client.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: input.objectKey,
    }),
  );
  const body = await response.Body?.transformToByteArray();

  if (!body) {
    return null;
  }

  const tempDir = path.join(os.tmpdir(), "clip-farmer");
  await mkdir(tempDir, { recursive: true });
  const tempPath = path.join(tempDir, `${randomUUID()}-${path.basename(input.objectKey)}`);
  await writeFile(tempPath, Buffer.from(body));

  return tempPath;
}
