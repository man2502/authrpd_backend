/**
 * Рекурсивно заменяет пары title_tm/title_ru, name_tm/name_ru, prefix_tm/prefix_ru, suffix_tm/suffix_ru
 * на одно поле без суффикса в зависимости от языка
 * @param {any} data - данные для локализации (объект, массив, примитив)
 * @param {string} lang - язык ('tm' или 'ru'), по умолчанию 'tm'
 * @returns {any} - локализованные данные
 */
function localize(data, lang = 'tm') {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => localize(item, lang));
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const result = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Обработка пар локализованных полей
      if (key.endsWith('_tm') || key.endsWith('_ru')) {
        const baseKey = key.slice(0, -3);
        const suffix = key.slice(-2);
        
        // Если это нужный язык, добавляем без суффикса
        if (suffix === lang) {
          result[baseKey] = value;
        }
        // Если это другой язык и базовое поле еще не добавлено, пропускаем
        // (чтобы не перезаписать правильное значение)
        continue;
      }
      
      // Рекурсивная обработка вложенных объектов
      result[key] = localize(value, lang);
    }
    
    return result;
  }

  return data;
}

module.exports = localize;

