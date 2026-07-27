/**
 * Demo identity helpers. In production these come from the authenticated
 * session (agency cookie / admin cookie). Hard-coded here so the panels work
 * without an auth system wired up.
 */
export const DEMO_AGENCY_ID = "agency_100"; // "Wanderly Travels" in admin-repo
export const DEMO_AGENCY_NAME = "Wanderly Travels";

// --- Demo credentials (shown on the login pages) ---------------------------
// In production, passwords are per-account bcrypt/argon2 hashes.
export const DEMO_AGENCY_EMAIL = "wanderlytravels@travel.in";
export const DEMO_AGENCY_PASSWORD = "agency123";

export const ADMIN_ID = "admin_1";
export const ADMIN_NAME = "TripSlab Admin";
export const ADMIN_EMAIL = "admin@tripslab.in";
export const DEMO_ADMIN_PASSWORD = "admin123";
