/**
 * Utility helper untuk standardisasi paginasi di seluruh controller backend
 */

/**
 * Parsing parameter paginasi dari req.query
 * @param {Object} query - Express req.query
 * @param {number} defaultLimit - default page size (10)
 * @param {number} maxLimit - batas maksimal page size (100)
 */
function parsePagination(query, defaultLimit = 10, maxLimit = 100) {
    const isPaginated = query.page !== undefined || query.limit !== undefined;
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    
    // Standarisasi batas limit yang diperbolehkan: default 10, max 100
    const rawLimit = parseInt(query.limit, 10) || defaultLimit;
    const limit = Math.min(maxLimit, Math.max(1, rawLimit));
    const skip = (page - 1) * limit;

    return {
        isPaginated,
        page,
        limit,
        skip,
    };
}

/**
 * Format respon standar paginasi
 * @param {Array} data - array item hasil query
 * @param {number} total - total record yang memenuhi filter
 * @param {number} page - halaman saat ini
 * @param {number} limit - jumlah item per halaman
 * @param {Object} extra - metadata tambahan (misal counts, summary)
 */
function buildPaginationResponse(data, total, page, limit, extra = {}) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
        ...extra,
    };
}

module.exports = {
    parsePagination,
    buildPaginationResponse,
};

