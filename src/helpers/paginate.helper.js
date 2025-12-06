/**
 * Создает объект пагинации для Sequelize
 * @param {number} page - номер страницы (начиная с 1)
 * @param {number} limit - количество элементов на странице
 * @returns {Object} - объект с offset и limit
 */
function getPagination(page = 1, limit = 20) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  return {
    offset,
    limit: limitNum,
    page: pageNum,
  };
}

/**
 * Форматирует результат пагинации
 * @param {Array} data - данные
 * @param {number} total - общее количество
 * @param {number} page - текущая страница
 * @param {number} limit - лимит на странице
 * @returns {Object} - объект с данными и метаинформацией
 */
function formatPaginatedResponse(data, total, page, limit) {
  return {
    items: data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  getPagination,
  formatPaginatedResponse,
};

