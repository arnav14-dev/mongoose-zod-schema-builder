import mongoose from 'mongoose';

/**
 * Creates a Mongoose schema from a schema definition object
 * @param {Object} schemaDefinition - The schema definition object
 * @param {Object} options - Additional options for schema creation
 * @param {Object} options.schemaOptions - Mongoose schema options (timestamps, etc.)
 * @param {Object} options.middleware - Pre/post hooks and middleware
 * @param {Object} options.virtuals - Virtual fields
 * @param {Object} options.indexes - Index definitions
 * @returns {mongoose.Schema} A Mongoose schema object
 */
export const createMongooseSchema = (schemaDefinition, options = {}) => {
    const mongooseSchemaObject = {};
    const { schemaOptions = {}, middleware = {}, virtuals = {}, indexes = {} } = options;

    for (const [fieldName, fieldProps] of Object.entries(schemaDefinition)) {
        const fieldConfig = {};

        // Handle type conversion from JavaScript types to Mongoose types
        // Support case-insensitive type definitions for better developer experience
        let mongooseType;
        const typeStr = typeof fieldProps.type === 'string' ? fieldProps.type.toLowerCase() : '';
        
        switch (fieldProps.type) {
            case String:
                mongooseType = String;
                break;
            case Number:
                mongooseType = Number;
                break;
            case Boolean:
                mongooseType = Boolean;
                break;
            case Date:
                mongooseType = Date;
                break;
            case Array:
                mongooseType = Array;
                break;
            default:
                // Handle string-based types with case-insensitive matching
                switch (typeStr) {
                    case 'string':
                        mongooseType = String;
                        break;
                    case 'number':
                        mongooseType = Number;
                        break;
                    case 'boolean':
                        mongooseType = Boolean;
                        break;
                    case 'date':
                        mongooseType = Date;
                        break;
                    case 'array':
                        mongooseType = Array;
                        break;
                    case 'objectid':
                    case 'object_id':
                        mongooseType = mongoose.Schema.Types.ObjectId;
                        break;
                    case 'mixed':
                        mongooseType = mongoose.Schema.Types.Mixed;
                        break;
                    case 'object':
                        mongooseType = mongoose.Schema.Types.Mixed;
                        break;
                    default:
                        mongooseType = fieldProps.type;
                }
        }

        fieldConfig.type = mongooseType;

        // Apply all other properties
        for (const [propName, propValue] of Object.entries(fieldProps)) {
            switch (propName) {
                case 'type':
                    // Already handled above
                    break;
                case 'required':
                    fieldConfig.required = propValue;
                    break;
                case 'unique':
                    fieldConfig.unique = propValue;
                    break;
                case 'minlength':
                case 'minLength':
                    fieldConfig.minlength = propValue;
                    break;
                case 'maxlength':
                case 'maxLength':
                    fieldConfig.maxlength = propValue;
                    break;
                case 'min':
                    fieldConfig.min = propValue;
                    break;
                case 'max':
                    fieldConfig.max = propValue;
                    break;
                case 'default':
                    fieldConfig.default = propValue;
                    break;
                case 'ref':
                    fieldConfig.ref = propValue;
                    break;
                case 'items':
                    // Handle array item types with case-insensitive support
                    if (fieldConfig.type === Array && propValue) {
                        const itemTypeStr = typeof propValue.type === 'string' ? propValue.type.toLowerCase() : '';
                        
                        if (propValue.type === String) {
                            fieldConfig.type = [String];
                        } else if (propValue.type === Number) {
                            fieldConfig.type = [Number];
                        } else if (propValue.type === Date) {
                            fieldConfig.type = [Date];
                        } else if (propValue.type === Boolean) {
                            fieldConfig.type = [Boolean];
                        } else if (propValue.type === Array) {
                            fieldConfig.type = [Array];
                        } else {
                            // Handle string-based types with case-insensitive matching
                            switch (itemTypeStr) {
                                case 'string':
                                    fieldConfig.type = [String];
                                    break;
                                case 'number':
                                    fieldConfig.type = [Number];
                                    break;
                                case 'date':
                                    fieldConfig.type = [Date];
                                    break;
                                case 'boolean':
                                    fieldConfig.type = [Boolean];
                                    break;
                                case 'array':
                                    fieldConfig.type = [Array];
                                    break;
                                case 'objectid':
                                case 'object_id':
                                    fieldConfig.type = [mongoose.Schema.Types.ObjectId];
                                    if (propValue.ref) {
                                        fieldConfig.ref = propValue.ref;
                                    }
                                    break;
                                case 'mixed':
                                case 'object':
                                    fieldConfig.type = [mongoose.Schema.Types.Mixed];
                                    break;
                                default:
                                    fieldConfig.type = [mongoose.Schema.Types.Mixed];
                            }
                        }
                    }
                    break;
                case 'email':
                    // For email validation in Mongoose, we typically use a custom validator
                    if (propValue === true) {
                        fieldConfig.validate = {
                            validator: function(v) {
                                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
                            },
                            message: 'Invalid email format'
                        };
                    }
                    break;
                case 'enum':
                    if (Array.isArray(propValue)) {
                        fieldConfig.enum = propValue;
                    }
                    break;
                case 'regex':
                case 'match':
                    if (propValue instanceof RegExp) {
                        fieldConfig.validate = {
                            validator: function(v) {
                                return propValue.test(v);
                            },
                            message: 'Invalid format'
                        };
                    } else if (typeof propValue === 'string') {
                        fieldConfig.validate = {
                            validator: function(v) {
                                return new RegExp(propValue).test(v);
                            },
                            message: 'Invalid format'
                        };
                    }
                    break;
                case 'select':
                    fieldConfig.select = propValue;
                    break;
                case 'sparse':
                    fieldConfig.sparse = propValue;
                    break;
                case 'index':
                    fieldConfig.index = propValue;
                    break;
                case 'text':
                    fieldConfig.text = propValue;
                    break;
                case 'unique':
                    fieldConfig.unique = propValue;
                    break;
                case 'immutable':
                    fieldConfig.immutable = propValue;
                    break;
                case 'transform':
                    fieldConfig.transform = propValue;
                    break;
                case 'get':
                    fieldConfig.get = propValue;
                    break;
                case 'set':
                    fieldConfig.set = propValue;
                    break;
            }
        }
        
        mongooseSchemaObject[fieldName] = fieldConfig;
    }

    // Create the schema with custom options
    const finalSchemaOptions = {
        timestamps: true,
        ...schemaOptions
    };
    
    const schema = new mongoose.Schema(mongooseSchemaObject, finalSchemaOptions);

    // Add middleware if provided
    if (middleware.pre) {
        Object.entries(middleware.pre).forEach(([hook, fn]) => {
            schema.pre(hook, fn);
        });
    }
    
    if (middleware.post) {
        Object.entries(middleware.post).forEach(([hook, fn]) => {
            schema.post(hook, fn);
        });
    }

    // Add virtuals if provided
    if (virtuals) {
        Object.entries(virtuals).forEach(([name, config]) => {
            if (typeof config === 'function') {
                schema.virtual(name).get(config);
            } else {
                const virtual = schema.virtual(name);
                if (config.get) virtual.get(config.get);
                if (config.set) virtual.set(config.set);
            }
        });
    }

    // Add indexes if provided
    if (indexes) {
        Object.entries(indexes).forEach(([field, indexConfig]) => {
            schema.index(field, indexConfig);
        });
    }

    return schema;
};