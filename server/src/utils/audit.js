const db = require('../models/db');

/**
 * auditLog(params)
 * Writes one row to audit_logs. Called after every data-modifying operation.
 *
 * @param {object} params
 * @param {string} params.userId      - user performing the action
 * @param {string} params.userEmail   - snapshot (survives user deletion)
 * @param {string} params.userRole    - snapshot
 * @param {string} params.action      - e.g. 'CREATE', 'UPDATE', 'DELETE'
 * @param {string} params.entityType  - e.g. 'asset', 'user'
 * @param {string} [params.entityId]  - PK of affected row
 * @param {object} [params.before]    - state before change (null for CREATE)
 * @param {object} [params.after]     - state after change  (null for DELETE)
 * @param {object} [params.req]       - Express request (for IP + user agent)
 */
const auditLog = async ({
  userId,
  userEmail,
  userRole,
  action,
  entityType,
  entityId   = null,
  before     = null,
  after      = null,
  req        = null,
}) => {
  try {
    await db('audit_logs').insert({
      user_id:      userId     || null,
      user_email:   userEmail  || null,
      user_role:    userRole   || null,
      action,
      entity_type:  entityType,
      entity_id:    entityId   || null,
      before_value: before ? JSON.stringify(before) : null,
      after_value:  after  ? JSON.stringify(after)  : null,
      ip_address:   req ? (req.ip || req.connection?.remoteAddress) : null,
      user_agent:   req ? req.headers['user-agent'] : null,
      created_at:   new Date(),
    });
  } catch (err) {
    // Never let audit failures break the main request
    console.error('[audit] Failed to write audit log:', err.message);
  }
};

/**
 * auditFromReq(req, action, entityType, entityId, before, after)
 * Convenience wrapper that extracts user info from req.user automatically.
 */
const auditFromReq = (req, action, entityType, entityId, before, after) =>
  auditLog({
    userId:     req.user?.id,
    userEmail:  req.user?.email,
    userRole:   req.user?.role,
    action,
    entityType,
    entityId,
    before,
    after,
    req,
  });

module.exports = { auditLog, auditFromReq };
