import type { Clip, ScheduledPost, SocialConnection, UserAccount } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";

export const SOCIAL_PLATFORMS = [
  "tiktok",
  "instagram",
  "youtube",
  "twitter",
  "linkedin",
  "facebook",
  "threads",
  "bluesky",
  "pinterest",
  "reddit",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialConnectionDTO = {
  id: string;
  provider: string;
  connectedPlatforms: SocialPlatform[];
  status: string;
  isConfigured: boolean;
  updatedAt: string;
};

export type ScheduledPostDTO = {
  id: string;
  clipId: string;
  clipTitle: string;
  clipUrl: string | null;
  projectName: string;
  provider: string;
  providerPostId: string | null;
  selectedPlatforms: SocialPlatform[];
  sharedCaption: string;
  platformOverrides: Record<string, string>;
  scheduledAt: string;
  timezone: string;
  status: string;
  failureReason: string | null;
  createdAt: string;
};

type ProviderScheduleInput = {
  idempotencyKey: string;
  mediaUrl: string;
  overrides?: Record<string, string>;
  platforms: SocialPlatform[];
  post: string;
  scheduleDate: string;
  connection: SocialConnection;
};

type ProviderScheduleResult = {
  providerPostId: string | null;
  response: unknown;
};

const ACTIVE_PROVIDER_STATUSES = new Set(["ACTIVE", "CONNECTED"]);

export function isSocialProviderConfigured() {
  return Boolean(process.env.AYRSHARE_API_KEY);
}

function apiBase() {
  return process.env.AYRSHARE_API_BASE_URL ?? "https://api.ayrshare.com/api";
}

function readJsonArray(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function readPlatforms(value: string | null | undefined): SocialPlatform[] {
  const allowed = new Set<string>(SOCIAL_PLATFORMS);
  return readJsonArray(value).filter((item): item is SocialPlatform =>
    allowed.has(item),
  );
}

function readJsonRecord(value: string | null | undefined): Record<string, string> {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}

function stringify(value: unknown) {
  return JSON.stringify(value ?? {});
}

function providerHeaders(profileKey?: string | null) {
  const apiKey = process.env.AYRSHARE_API_KEY;

  if (!apiKey) {
    throw new ValidationError("Social provider is not configured.", 503);
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...(profileKey ? { "Profile-Key": profileKey } : {}),
  };
}

async function providerFetch<T>(
  path: string,
  options: RequestInit & { profileKey?: string | null } = {},
) {
  const response = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers: {
      ...providerHeaders(options.profileKey),
      ...options.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Social provider request failed.";
    throw new ValidationError(message, response.status);
  }

  return payload;
}

async function ensureAyrshareConnection(account: UserAccount) {
  const existing = await prisma.socialConnection.findUnique({
    where: {
      userAccountId_provider: {
        userAccountId: account.id,
        provider: "ayrshare",
      },
    },
  });

  if (existing?.providerProfileKey) {
    return existing;
  }

  if (!isSocialProviderConfigured()) {
    const demoPlatforms = [
      "tiktok",
      "instagram",
      "youtube",
      "twitter",
      "linkedin",
      "facebook",
      "threads",
    ] satisfies SocialPlatform[];

    return prisma.socialConnection.upsert({
      where: {
        userAccountId_provider: {
          userAccountId: account.id,
          provider: "ayrshare",
        },
      },
      update: {
        connectedPlatforms: JSON.stringify(demoPlatforms),
        status: "ACTIVE",
        metadata: stringify({ mode: "local-demo" }),
      },
      create: {
        userAccountId: account.id,
        provider: "ayrshare",
        providerProfileId: `demo-${account.id}`,
        providerProfileKey: `demo-${account.id}`,
        connectedPlatforms: JSON.stringify(demoPlatforms),
        status: "ACTIVE",
        metadata: stringify({ mode: "local-demo" }),
      },
    });
  }

  const payload = await providerFetch<{
    refId?: string;
    profileKey?: string;
    title?: string;
  }>("/profiles", {
    method: "POST",
    body: stringify({
      title: account.email ?? `Clip Farmer ${account.id}`,
      topHeader: "Connect Clip Farmer to your social accounts",
      subHeader: "Choose the channels you want Clip Farmer to plant clips in.",
    }),
  });

  return prisma.socialConnection.upsert({
    where: {
      userAccountId_provider: {
        userAccountId: account.id,
        provider: "ayrshare",
      },
    },
    update: {
      providerProfileId: payload.refId ?? existing?.providerProfileId,
      providerProfileKey: payload.profileKey ?? existing?.providerProfileKey,
      status: "DISCONNECTED",
      metadata: stringify(payload),
    },
    create: {
      userAccountId: account.id,
      provider: "ayrshare",
      providerProfileId: payload.refId ?? null,
      providerProfileKey: payload.profileKey ?? null,
      status: "DISCONNECTED",
      metadata: stringify(payload),
    },
  });
}

export async function createSocialConnectUrl(account: UserAccount) {
  const connection = await ensureAyrshareConnection(account);

  if (!isSocialProviderConfigured()) {
    return {
      connection,
      url: "/account?social=demo-connected",
    };
  }

  const privateKey = process.env.AYRSHARE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const domain = process.env.AYRSHARE_JWT_DOMAIN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!privateKey || !domain || !connection.providerProfileKey) {
    throw new ValidationError(
      "Set AYRSHARE_PRIVATE_KEY and AYRSHARE_JWT_DOMAIN to open the social account linking page.",
      503,
    );
  }

  const payload = await providerFetch<{ url?: string; jwtUrl?: string }>("/profiles/generateJWT", {
    method: "POST",
    body: stringify({
      domain,
      privateKey,
      profileKey: connection.providerProfileKey,
      redirect: `${appUrl.replace(/\/$/, "")}/account?social=connected&origin=true`,
      allowedSocial: SOCIAL_PLATFORMS,
    }),
  });

  const url = payload.url ?? payload.jwtUrl;
  if (!url) {
    throw new ValidationError("The social provider did not return a connection URL.", 502);
  }

  return { connection, url };
}

export async function refreshSocialConnection(account: UserAccount) {
  const connection = await prisma.socialConnection.findUnique({
    where: {
      userAccountId_provider: {
        userAccountId: account.id,
        provider: "ayrshare",
      },
    },
  });

  if (!connection) {
    return null;
  }

  if (!isSocialProviderConfigured()) {
    return connection;
  }

  if (!connection.providerProfileKey) {
    return connection;
  }

  const payload = await providerFetch<{
    activeSocialAccounts?: string[];
    displayNames?: unknown[];
  }>("/user", {
    method: "GET",
    profileKey: connection.providerProfileKey,
  });
  const platforms = (payload.activeSocialAccounts ?? []).filter((platform) =>
    SOCIAL_PLATFORMS.includes(platform as SocialPlatform),
  );

  return prisma.socialConnection.update({
    where: { id: connection.id },
    data: {
      connectedPlatforms: JSON.stringify(platforms),
      status: platforms.length > 0 ? "ACTIVE" : "DISCONNECTED",
      metadata: stringify(payload),
    },
  });
}

export async function getSocialConnections(account: UserAccount) {
  const refreshed = await refreshSocialConnection(account);
  const connections = refreshed
    ? [refreshed]
    : await prisma.socialConnection.findMany({
        where: { userAccountId: account.id },
        orderBy: { updatedAt: "desc" },
      });

  return connections.map(toSocialConnectionDTO);
}

export function toSocialConnectionDTO(connection: SocialConnection): SocialConnectionDTO {
  return {
    id: connection.id,
    provider: connection.provider,
    connectedPlatforms: readPlatforms(connection.connectedPlatforms),
    status: connection.status,
    isConfigured: isSocialProviderConfigured(),
    updatedAt: connection.updatedAt.toISOString(),
  };
}

export function assertSelectedPlatforms(value: unknown) {
  if (!Array.isArray(value)) {
    throw new ValidationError("Choose at least one social channel.");
  }

  const allowed = new Set<string>(SOCIAL_PLATFORMS);
  const platforms = Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .filter((item) => allowed.has(item)),
    ),
  ) as SocialPlatform[];

  if (platforms.length === 0) {
    throw new ValidationError("Choose at least one social channel.");
  }

  return platforms;
}

export function assertScheduleCaption(value: unknown) {
  if (typeof value !== "string") {
    throw new ValidationError("Post caption is required.");
  }

  const caption = value.trim();
  if (caption.length < 1 || caption.length > 2200) {
    throw new ValidationError("Caption must be 1-2200 characters.");
  }

  return caption;
}

export function assertPlatformOverrides(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const overrides: Record<string, string> = {};
  const allowed = new Set<string>(SOCIAL_PLATFORMS);
  for (const [platform, caption] of Object.entries(value)) {
    if (!allowed.has(platform)) {
      continue;
    }

    if (typeof caption === "string" && caption.trim()) {
      overrides[platform] = caption.trim().slice(0, 2200);
    }
  }

  return overrides;
}

export function assertScheduledAt(value: unknown) {
  if (typeof value !== "string") {
    throw new ValidationError("Schedule time is required.");
  }

  const scheduledAt = new Date(value);
  if (!Number.isFinite(scheduledAt.getTime())) {
    throw new ValidationError("Schedule time is invalid.");
  }

  if (scheduledAt.getTime() < Date.now() + 60 * 1000) {
    throw new ValidationError("Schedule clips at least one minute in the future.");
  }

  return scheduledAt;
}

export function assertTimezone(value: unknown) {
  if (typeof value !== "string" || value.trim().length < 1) {
    return "UTC";
  }

  return value.trim().slice(0, 80);
}

export function toProviderMediaUrl(clip: Pick<Clip, "url">) {
  if (!clip.url) {
    throw new ValidationError("This clip does not have a rendered file yet.");
  }

  if (/^https:\/\//i.test(clip.url)) {
    return clip.url;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl?.startsWith("https://")) {
    return `${appUrl.replace(/\/$/, "")}${clip.url.startsWith("/") ? "" : "/"}${clip.url}`;
  }

  if (isSocialProviderConfigured()) {
    throw new ValidationError(
      "The social planting row needs an HTTPS clip URL. Configure R2_PUBLIC_BASE_URL or NEXT_PUBLIC_APP_URL with a public HTTPS host.",
      400,
    );
  }

  return clip.url;
}

export function assertConnectionCanPost(
  connection: SocialConnection | null,
  platforms: SocialPlatform[],
) {
  if (!connection || !ACTIVE_PROVIDER_STATUSES.has(connection.status)) {
    throw new ValidationError("Connect at least one social account before scheduling.");
  }

  const connected = readPlatforms(connection.connectedPlatforms);
  const missing = platforms.filter((platform) => !connected.includes(platform));
  if (missing.length > 0) {
    throw new ValidationError(
      `Connect ${missing.join(", ")} before scheduling to those channels.`,
    );
  }
}

function mergePlatformCopy(post: string, overrides: Record<string, string>) {
  const entries = Object.entries(overrides).filter(([, value]) => value.trim());
  if (entries.length === 0) {
    return {};
  }

  return {
    platformsContent: entries.map(([platform, text]) => ({
      platform,
      post: text || post,
    })),
  };
}

export async function scheduleWithProvider(input: ProviderScheduleInput) {
  if (!isSocialProviderConfigured()) {
    return {
      providerPostId: `mock-${input.idempotencyKey}`,
      response: {
        status: "success",
        id: `mock-${input.idempotencyKey}`,
        mode: "local-demo",
      },
    } satisfies ProviderScheduleResult;
  }

  const response = await providerFetch<{ id?: string }>("/post", {
    method: "POST",
    profileKey: input.connection.providerProfileKey,
    body: stringify({
      post: input.post,
      platforms: input.platforms,
      mediaUrls: [input.mediaUrl],
      isVideo: true,
      scheduleDate: input.scheduleDate,
      validateScheduled: true,
      idempotencyKey: input.idempotencyKey,
      notes: "Scheduled from Clip Farmer",
      ...mergePlatformCopy(input.post, input.overrides ?? {}),
    }),
  });

  return {
    providerPostId: response.id ?? null,
    response,
  } satisfies ProviderScheduleResult;
}

export async function cancelWithProvider(connection: SocialConnection, providerPostId: string) {
  if (!isSocialProviderConfigured() || providerPostId.startsWith("mock-")) {
    return { status: "success", id: providerPostId, mode: "local-demo" };
  }

  return providerFetch("/post", {
    method: "DELETE",
    profileKey: connection.providerProfileKey,
    body: stringify({ id: providerPostId }),
  });
}

export function toScheduledPostDTO(
  post: ScheduledPost & {
    clip: Clip & { project: { name: string } };
  },
): ScheduledPostDTO {
  return {
    id: post.id,
    clipId: post.clipId,
    clipTitle: post.clip.title,
    clipUrl: post.clip.url,
    projectName: post.clip.project.name,
    provider: post.provider,
    providerPostId: post.providerPostId,
    selectedPlatforms: readPlatforms(post.selectedPlatforms),
    sharedCaption: post.sharedCaption,
    platformOverrides: readJsonRecord(post.platformOverrides),
    scheduledAt: post.scheduledAt.toISOString(),
    timezone: post.timezone,
    status: post.status,
    failureReason: post.failureReason,
    createdAt: post.createdAt.toISOString(),
  };
}

export async function retryScheduledPost(post: ScheduledPost & { clip: Clip }) {
  if (post.status !== "FAILED") {
    throw new ValidationError("Only failed scheduled posts can be retried.");
  }

  const connection = await prisma.socialConnection.findUnique({
    where: {
      userAccountId_provider: {
        userAccountId: post.userAccountId,
        provider: post.provider,
      },
    },
  });
  const platforms = readPlatforms(post.selectedPlatforms);
  assertConnectionCanPost(connection, platforms);

  const mediaUrl = toProviderMediaUrl(post.clip);
  const providerResult = await scheduleWithProvider({
    idempotencyKey: `${post.id}-retry-${Date.now()}`,
    mediaUrl,
    platforms,
    post: post.sharedCaption,
    scheduleDate: post.scheduledAt.toISOString(),
    connection: connection!,
  });

  return prisma.scheduledPost.update({
    where: { id: post.id },
    data: {
      providerPostId: providerResult.providerPostId,
      providerResponse: stringify(providerResult.response),
      failureReason: null,
      status: "SCHEDULED",
    },
    include: {
      clip: {
        include: {
          project: {
            select: { name: true },
          },
        },
      },
    },
  });
}
