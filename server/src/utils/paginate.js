/**
 * paginate(query, req)
 * Applies LIMIT + OFFSET to a Knex query and returns a standardised
 * pagination envelope alongside the data.
 *
 * Query params read from req.query:
 *   page    - page number, 1-indexed (default: 1)
 *   limit   - rows per page (default: 25, max: 100)
 *
 * Returns:
 * {
 *   data: [...],
 *   pagination: { page, limit, total, totalPages, hasNext, hasPrev }
 * }
 */
const paginate = async (query, req) => {
  const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
  const offset = (page - 1) * limit;

  // Count total rows (clone query before adding limit/offset)
  const countQuery  = query.clone().clearSelect().clearOrder().count('* as total');
  const [{ total }] = await countQuery;
  const totalCount  = parseInt(total, 10);

  // Fetch page
  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total:      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext:    page * limit < totalCount,
      hasPrev:    page > 1,
    },
  };
};

module.exports = { paginate };
