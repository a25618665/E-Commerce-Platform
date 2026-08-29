const ROLE_ALIASES = Object.freeze({
  admin: "admin",
  administrator: "admin",
  seller: "seller",
  buyer: "member",
  member: "member",
  "110": "member",
});

function normalizeRole(memberType) {
  const normalized = String(memberType || "member").trim().toLowerCase();
  return ROLE_ALIASES[normalized] || "member";
}

function attachSessionUser(request, _response, next) {
  const session = request.signedCookies && request.signedCookies.session;
  request.user =
    session && typeof session === "object" && Number.isInteger(session.memberId)
      ? session
      : null;
  next();
}

function requireRoles(...allowedRoles) {
  const allowed = new Set(allowedRoles);
  return function authorize(request, response, next) {
    if (!request.user) {
      return response.status(401).send("Authentication required.");
    }
    if (!allowed.has(request.user.role)) {
      return response.status(403).send("Insufficient permissions.");
    }
    return next();
  };
}

module.exports = { attachSessionUser, normalizeRole, requireRoles };
