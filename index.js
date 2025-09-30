import { createMongooseSchema } from './src/models/mongooseSchema.js';
import { createZodSchema, normalizeZodErrors } from './src/models/zodSchema.js';

// Simple cache for schema generation to improve performance
const schemaCache = new Map();

/**
 * Generates a cache key for the schema definition
 * @param {Object} schemaDefinition - The schema definition object
 * @param {Object} options - Additional options
 * @returns {string} Cache key
 */
const generateCacheKey = (schemaDefinition, options = {}) => {
    return JSON.stringify({ schemaDefinition, options });
};

/**
 * Main function that takes a schema definition and returns both Mongoose and Zod schema builders
 * @param {Object} schemaDefinition - The schema definition object
 * @param {Object} options - Additional options for schema creation
 * @param {boolean} options.enableCache - Enable caching for better performance (default: true)
 * @returns {Object} Object containing mongooseSchema and zodSchema
 */
const createSchemas = (schemaDefinition, options = {}) => {
    const { enableCache = true, ...schemaOptions } = options;
    
    if (enableCache) {
        const cacheKey = generateCacheKey(schemaDefinition, schemaOptions);
        if (schemaCache.has(cacheKey)) {
            return schemaCache.get(cacheKey);
        }
    }
    
    const result = {
        mongooseSchema: createMongooseSchema(schemaDefinition, schemaOptions),
        zodSchema: createZodSchema(schemaDefinition, schemaOptions)
    };
    
    if (enableCache) {
        const cacheKey = generateCacheKey(schemaDefinition, schemaOptions);
        schemaCache.set(cacheKey, result);
    }
    
    return result;
};

export { createMongooseSchema, createZodSchema, createSchemas, normalizeZodErrors };

// Optional: You can still have a default export
export default createSchemas;