import { describe, expect, it, vi } from "vitest";
import {
  MATHPRO_GUEST_COOKIE_MAX_AGE_SECONDS,
  MATHPRO_GUEST_COOKIE_NAME,
  readGuestIdentity,
  resolveGuestIdentity,
} from "./guest-identity";

function createCookieStore(initialGuestId?: string) {
  const values = new Map<string, string>();

  if (initialGuestId) {
    values.set(MATHPRO_GUEST_COOKIE_NAME, initialGuestId);
  }

  return {
    values,
    get(name: string) {
      const value = values.get(name);
      return value ? { value } : undefined;
    },
    set: vi.fn((name: string, value: string) => {
      values.set(name, value);
    }),
  };
}

describe("guest-identity", () => {
  it("reads an existing guest cookie", () => {
    const cookieStore = createCookieStore("guest-existing");

    expect(readGuestIdentity(cookieStore)).toBe("guest-existing");
  });

  it("returns an existing guest id without rewriting the cookie", () => {
    const cookieStore = createCookieStore("guest-existing");

    expect(resolveGuestIdentity(cookieStore)).toEqual({
      guestId: "guest-existing",
      isNew: false,
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("creates and stores a new guest id when the cookie is missing", () => {
    const cookieStore = createCookieStore();
    const randomUuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("guest-generated");

    expect(resolveGuestIdentity(cookieStore)).toEqual({
      guestId: "guest-generated",
      isNew: true,
    });
    expect(cookieStore.set).toHaveBeenCalledWith(
      MATHPRO_GUEST_COOKIE_NAME,
      "guest-generated",
      {
        path: "/",
        sameSite: "lax",
        maxAge: MATHPRO_GUEST_COOKIE_MAX_AGE_SECONDS,
        secure: false,
      },
    );

    randomUuidSpy.mockRestore();
  });
});
