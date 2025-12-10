const { RpdInstance, Region } = require('../../../models');
const { resolveTopRegion } = require('../../catalogs/services/region.service');
const { cacheData, invalidateCache } = require('../../../helpers/cache.helper');
const logger = require('../../../config/logger');
const ApiError = require('../../../helpers/api.error');
/**
 * Gets the RPD instance for a given region.
 * If the region is a sub-region, resolves to its top parent region first.
 * 
 * @param {string} regionId - The region code (can be sub-region or top region)
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<Object>} - RPD instance object with id, code, region_id, audience, is_active
 * @throws {ApiError} - If top region not found, RPD instance not found, or instance is inactive
 * 
 * @example
 * // For top region
 * const instance = await getRpdInstanceByRegion('AHAL');
 * // Returns: { id: 1, code: 'rpd_ahal', region_id: 'AHAL', audience: 'rpd:ahal', is_active: true }
 * 
 * // For sub-region
 * const instance = await getRpdInstanceByRegion('ASGABAT_CITY');
 * // Resolves to top region 'AHAL' and returns its RPD instance
 */
async function getRpdInstanceByRegion(regionId, useCache = true) {
  if (!regionId) {
    throw new ApiError(400, 'Region ID is required');
  }

  const cacheKey = `rpd:instance:region:${regionId}`;
  const cacheTTL = 1800; // 30 minutes

  // Helper function to perform the actual lookup
  const lookup = async () => {
    // Step 1: Resolve to top region
    const topRegionId = await resolveTopRegion(regionId, useCache);
    
    // Step 2: Find RPD instance for top region
    const rpdInstance = await RpdInstance.findOne({
      where: {
        region_id: topRegionId,
        is_active: true,
      },
      include: [
        {
          model: Region,
          as: 'region',
          attributes: ['code', 'title_tm', 'title_ru'],
          required: false,
        },
      ],
    });

    if (!rpdInstance) {
      logger.error(`RPD instance not found for top region: ${topRegionId} (original region: ${regionId})`);
      throw new ApiError(
        404,
        `RPD instance not found for region: ${regionId}. No active RPD instance configured for top region: ${topRegionId}`
      );
    }

    return {
      id: rpdInstance.id,
      code: rpdInstance.code,
      region_id: rpdInstance.region_id,
      top_region_id: topRegionId,
      original_region_id: regionId !== topRegionId ? regionId : null,
      audience: rpdInstance.audience,
      is_active: rpdInstance.is_active,
      region: rpdInstance.region ? {
        code: rpdInstance.region.code,
        title_tm: rpdInstance.region.title_tm,
        title_ru: rpdInstance.region.title_ru,
      } : null,
    };
  };

  // Use cache if enabled
  if (useCache) {
    return await cacheData(cacheKey, lookup, cacheTTL);
  }

  return await lookup();
}

/**
 * Gets all active RPD instances.
 * 
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<Array>} - Array of active RPD instances
 */
async function getAllActiveRpdInstances(useCache = true) {
  const cacheKey = 'rpd:instances:all:active';
  const cacheTTL = 1800; // 30 minutes

  const fetch = async () => {
    const instances = await RpdInstance.findAll({
      where: { is_active: true },
      include: [
        {
          model: Region,
          as: 'region',
          attributes: ['code', 'title_tm', 'title_ru'],
          required: true,
        },
      ],
      order: [['code', 'ASC']],
    });

    return instances.map(instance => ({
      id: instance.id,
      code: instance.code,
      region_id: instance.region_id,
      audience: instance.audience,
      is_active: instance.is_active,
      region: instance.region ? {
        code: instance.region.code,
        title_tm: instance.region.title_tm,
        title_ru: instance.region.title_ru,
      } : null,
    }));
  };

  if (useCache) {
    return await cacheData(cacheKey, fetch, cacheTTL);
  }

  return await fetch();
}

/**
 * Gets an RPD instance by its code.
 * 
 * @param {string} code - The RPD instance code
 * @returns {Promise<Object>} - RPD instance object
 * @throws {ApiError} - If instance not found
 */
async function getRpdInstanceByCode(code) {
  if (!code) {
    throw new ApiError(400, 'RPD instance code is required');
  }

  const instance = await RpdInstance.findOne({
    where: { code, is_active: true },
    include: [
      {
        model: Region,
        as: 'region',
        attributes: ['code', 'title_tm', 'title_ru'],
        required: false,
      },
    ],
  });

  if (!instance) {
    throw new ApiError(404, `RPD instance not found: ${code}`);
  }

  return {
    id: instance.id,
    code: instance.code,
    region_id: instance.region_id,
    audience: instance.audience,
    is_active: instance.is_active,
    region: instance.region ? {
      code: instance.region.code,
      title_tm: instance.region.title_tm,
      title_ru: instance.region.title_ru,
    } : null,
  };
}

/**
 * Creates a new RPD instance.
 * Validates that region_id is a top region (parent_id IS NULL).
 * 
 * @param {Object} data - RPD instance data { code, region_id, audience, is_active? }
 * @returns {Promise<Object>} - Created RPD instance
 * @throws {ApiError} - If validation fails or instance already exists
 */
async function createRpdInstance(data) {
  const { code, region_id, audience, is_active = true } = data;

  // Validate required fields
  if (!code || !region_id || !audience) {
    throw new ApiError(400, 'code, region_id, and audience are required');
  }

  // Validate that region is a top region
  const region = await Region.findOne({
    where: { code: region_id, is_active: true },
    attributes: ['code', 'parent_id'],
  });

  if (!region) {
    throw new ApiError(404, `Region not found: ${region_id}`);
  }

  if (region.parent_id) {
    throw new ApiError(
      400,
      `Cannot create RPD instance for sub-region: ${region_id}. Only top regions (without parent_id) can have RPD instances.`
    );
  }

  // Check for duplicate code or audience
  const existingByCode = await RpdInstance.findOne({ where: { code } });
  if (existingByCode) {
    throw new ApiError(409, `RPD instance with code already exists: ${code}`);
  }

  const existingByAudience = await RpdInstance.findOne({ where: { audience } });
  if (existingByAudience) {
    throw new ApiError(409, `RPD instance with audience already exists: ${audience}`);
  }

  const existingByRegion = await RpdInstance.findOne({ where: { region_id } });
  if (existingByRegion) {
    throw new ApiError(409, `RPD instance already exists for region: ${region_id}`);
  }

  // Create instance
  const instance = await RpdInstance.create({
    code,
    region_id,
    audience,
    is_active,
  });

  // Invalidate cache
  await invalidateCache('rpd:instances:all:active');

  logger.info(`RPD instance created: ${code} for region ${region_id}`);

  return instance;
}

/**
 * Invalidates the cache for an RPD instance lookup.
 * Call this when RPD instance data changes.
 * 
 * @param {string} regionId - The region code to invalidate cache for
 */
async function invalidateRpdInstanceCache(regionId) {
  if (!regionId) {
    return;
  }

  await invalidateCache(`rpd:instance:region:${regionId}`);
  await invalidateCache('rpd:instances:all:active');
}

module.exports = {
  getRpdInstanceByRegion,
  getAllActiveRpdInstances,
  getRpdInstanceByCode,
  createRpdInstance,
  invalidateRpdInstanceCache,
};

