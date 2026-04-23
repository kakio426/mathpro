export const MATHPRO_GUEST_COOKIE_NAME = "mathpro_guest_id";
export const MATHPRO_GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type GuestCookieOptions = {
  path: string;
  sameSite: "lax";
  maxAge: number;
  secure: boolean;
};

export type GuestCookieStore = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: GuestCookieOptions): void;
};

export function getGuestCookieOptions(): GuestCookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    maxAge: MATHPRO_GUEST_COOKIE_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  };
}

export function readGuestIdentity(cookieStore: GuestCookieStore) {
  return cookieStore.get(MATHPRO_GUEST_COOKIE_NAME)?.value ?? null;
}

export function resolveGuestIdentity(cookieStore: GuestCookieStore) {
  const existingGuestId = readGuestIdentity(cookieStore);

  if (existingGuestId) {
    return {
      guestId: existingGuestId,
      isNew: false,
    };
  }

  const guestId = crypto.randomUUID();
  cookieStore.set(
    MATHPRO_GUEST_COOKIE_NAME,
    guestId,
    getGuestCookieOptions(),
  );

  return {
    guestId,
    isNew: true,
  };
}
