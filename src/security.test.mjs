import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildContentSecurityPolicy,
  createCspNonce,
  createVerificationCookie,
  escapeHtmlAttribute,
  hashEmailChangeToken,
  isVerificationCookieValid,
  safeLocalReturnTo,
} from "./security.ts";

test("return paths stay on the current origin", () => {
  assert.equal(
    safeLocalReturnTo("/wiki/home?lang=kn", "https://lingadevaru.in"),
    "/wiki/home?lang=kn",
  );
  assert.equal(
    safeLocalReturnTo("//attacker.example/path", "https://lingadevaru.in"),
    "/",
  );
  assert.equal(
    safeLocalReturnTo(
      "https://attacker.example/path",
      "https://lingadevaru.in",
    ),
    "/",
  );
  assert.equal(
    safeLocalReturnTo("/\\attacker.example", "https://lingadevaru.in"),
    "/",
  );
});

test("HTML attribute values are escaped", () => {
  assert.equal(
    escapeHtmlAttribute(`"><script>alert(1)</script>&'`),
    "&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;&amp;&#39;",
  );
});

test("email-change token hashes are stable and do not reveal the token", async () => {
  const token = "9b7075e4-47b0-4092-a151-00cd12489d9d";
  const firstHash = await hashEmailChangeToken(token);

  assert.equal(await hashEmailChangeToken(token), firstHash);
  assert.match(firstHash, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(firstHash, token);
});

test("verification cookie is signed and expires within its lifetime", async () => {
  const secret = "test-secret";
  const now = 1_800_000_000;
  const cookie = await createVerificationCookie(secret, now);

  assert.equal(await isVerificationCookieValid(secret, cookie, now), true);
  assert.equal(
    await isVerificationCookieValid("wrong-secret", cookie, now),
    false,
  );
  assert.equal(
    await isVerificationCookieValid(secret, `${cookie.slice(0, -1)}A`, now),
    false,
  );
  assert.equal(
    await isVerificationCookieValid(secret, cookie, now + 86400),
    false,
  );
  assert.equal(await isVerificationCookieValid(secret, "true", now), false);
});

test("CSP uses a fresh nonce and disallows inline scripts", () => {
  const firstNonce = createCspNonce();
  const secondNonce = createCspNonce();
  const policy = buildContentSecurityPolicy(firstNonce);

  assert.notEqual(firstNonce, secondNonce);
  assert.match(policy, new RegExp(`'nonce-${firstNonce}'`));
  assert.match(policy, /'strict-dynamic'/);
  assert.doesNotMatch(policy, /script-src[^;]*'unsafe-inline'/);
});
