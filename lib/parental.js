/**
 * A player under the country age cannot open their own profile.
 * A profile aged 18 or older can add that player and can turn them off.
 * This is a parent lock on the account, not an identity-document check.
 */
import { ageIsAllowed } from "./age-gate.js";

export const PARENT_MIN_AGE = 18;
export const CHILD_MIN_AGE = 10;

export function canBeParent(profile, detected) {
  if (!profile || profile.role === "child" || profile.playLocked) return false;
  const age = Number(profile.age);
  if (!Number.isInteger(age) || age < PARENT_MIN_AGE || age > 120) return false;
  return ageIsAllowed(age, profile.country, detected || "");
}

/** Play uses the stored profile. A child plays only while the parent consent stands. */
export function canPlay(profile, detected) {
  if (!profile || profile.playLocked || !profile.passwordHash) return false;
  const age = Number(profile.age);
  if (!Number.isInteger(age) || age > 120) return false;
  if (profile.role === "child") {
    return Boolean(profile.parentId && profile.consentAt) && age >= CHILD_MIN_AGE;
  }
  return ageIsAllowed(age, profile.country, detected || "");
}
