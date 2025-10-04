import { z } from 'zod';

/**
 * Normalizes Zod validation errors into a consistent format
 * @param {z.ZodError} error - The Zod validation error
 * @returns {Array} Normalized error array
 */
export const normalizeZodErrors = (error) => {
    // Handle both Zod v3 (errors) and v4 (issues) formats
    const errorList = error.issues || error.errors || [];
    
    return errorList.map(err => ({
        field: err.path ? err.path.join('.') : 'unknown',
        message: err.message || 'Validation failed',
        code: err.code || 'unknown',
        value: err.input || err.received,
        type: err.expected || err.format || 'unknown'
    }));
};

/**
 * Creates a custom error message handler
 * @param {string} fieldName - The field name
 * @param {string} rule - The validation rule
 * @param {*} value - The field value
 * @param {Object} customMessages - Custom message overrides
 * @returns {string} Formatted error message
 */
const getCustomMessage = (fieldName, rule, value, customMessages = {}) => {
    const key = `${fieldName}.${rule}`;
    if (customMessages[key]) {
        return customMessages[key];
    }
    
    const defaultMessages = {
        required: `${fieldName} is required`,
        min: `${fieldName} must be at least ${value}`,
        max: `${fieldName} must be at most ${value}`,
        minlength: `${fieldName} must be at least ${value} characters`,
        maxlength: `${fieldName} must be at most ${value} characters`,
        email: `${fieldName} must be a valid email address`,
        regex: `${fieldName} format is invalid`,
        enum: `${fieldName} must be one of the allowed values`
    };
    
    return defaultMessages[rule] || `${fieldName} validation failed`;
};

/**
 * Creates a Zod schema from a schema definition object
 * @param {Object} schemaDefinition - The schema definition object
 * @param {Object} options - Additional options for schema creation
 * @param {boolean} options.strictMode - Enable strict validation mode
 * @param {Object} options.customMessages - Custom error messages
 * @returns {z.ZodObject} A Zod schema object
 */
export const createZodSchema = (schemaDefinition, options = {}) => {
    const { strictMode = false, customMessages = {} } = options;
    const zodSchemaObject = {};

    for (const [fieldName, fieldProps] of Object.entries(schemaDefinition)) {
        let zodValidator;

        // Handle array fields where fieldProps is an array
        if (Array.isArray(fieldProps)) {
            const itemType = fieldProps[0]?.type || 'String';
            let itemValidator;
            
            if (itemType === String || itemType === 'String') {
                itemValidator = z.string();
            } else if (itemType === Number || itemType === 'Number') {
                itemValidator = z.number();
            } else if (itemType === Boolean || itemType === 'Boolean') {
                itemValidator = z.boolean();
            } else if (itemType === Date || itemType === 'Date') {
                itemValidator = z.date();
            } else {
                itemValidator = z.any();
            }
            
            // Apply enum validation if present
            if (fieldProps[0]?.enum) {
                const lowerCaseEnum = fieldProps[0].enum.map(val => val.toLowerCase());
                itemValidator = itemValidator
                    .toLowerCase()
                    .refine((val) => lowerCaseEnum.includes(val), {
                        message: `${fieldName} must be one of: ${fieldProps[0].enum.join(', ')}`
                    });
            }
            
            zodValidator = z.array(itemValidator);
            zodSchemaObject[fieldName] = zodValidator;
            continue;
        }

        // Step 1: Handle the base type first with case-insensitive support
        const typeStr = typeof fieldProps.type === 'string' ? fieldProps.type.toLowerCase() : '';
        
        switch (fieldProps.type) {
            case String:
                zodValidator = z.string();
                break;
            case Number:
                zodValidator = z.number();
                break;
            case Boolean:
                zodValidator = z.boolean();
                break;
            case Date:
                zodValidator = z.date();
                break;
            case Array:
                // Handle arrays - if items property exists, use it to define array element type
                if (fieldProps.items) {
                    let itemValidator;
                    const itemTypeStr = typeof fieldProps.items.type === 'string' ? fieldProps.items.type.toLowerCase() : '';
                    
                    if (fieldProps.items.type === String) {
                        itemValidator = z.string();
                    } else if (fieldProps.items.type === Number) {
                        itemValidator = z.number();
                    } else if (fieldProps.items.type === Boolean) {
                        itemValidator = z.boolean();
                    } else if (fieldProps.items.type === Date) {
                        itemValidator = z.date();
                    } else {
                        // Handle string-based types with case-insensitive matching
                        switch (itemTypeStr) {
                            case 'string':
                                itemValidator = z.string();
                                break;
                            case 'number':
                                itemValidator = z.number();
                                break;
                            case 'boolean':
                                itemValidator = z.boolean();
                                break;
                            case 'date':
                                itemValidator = z.date();
                                break;
                            case 'objectid':
                            case 'object_id':
                                itemValidator = z.string().length(24, 'Invalid ObjectId').regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
                                break;
                            default:
                                itemValidator = z.any();
                        }
                    }
                    zodValidator = z.array(itemValidator);
                } else {
                    zodValidator = z.array(z.any());
                }
                break;
            case Object:
                zodValidator = z.object({}).passthrough();
                break;
            case Map:
                // Map type - treat as object with string values
                zodValidator = z.object({}).catchall(z.string());
                break;
            default:
                // Handle string-based types with case-insensitive matching
                switch (typeStr) {
                    case 'string':
                        zodValidator = z.string();
                        break;
                    case 'number':
                        zodValidator = z.number();
                        break;
                    case 'boolean':
                        zodValidator = z.boolean();
                        break;
                    case 'date':
                        zodValidator = z.date();
                        break;
                    case 'array':
                        // Handle arrays - if items property exists, use it to define array element type
                        if (fieldProps.items) {
                            let itemValidator;
                            const itemTypeStr = typeof fieldProps.items.type === 'string' ? fieldProps.items.type.toLowerCase() : '';
                            
                            if (fieldProps.items.type === String) {
                                itemValidator = z.string();
                            } else if (fieldProps.items.type === Number) {
                                itemValidator = z.number();
                            } else if (fieldProps.items.type === Boolean) {
                                itemValidator = z.boolean();
                            } else if (fieldProps.items.type === Date) {
                                itemValidator = z.date();
                            } else {
                                // Handle string-based types with case-insensitive matching
                                switch (itemTypeStr) {
                                    case 'string':
                                        itemValidator = z.string();
                                        break;
                                    case 'number':
                                        itemValidator = z.number();
                                        break;
                                    case 'boolean':
                                        itemValidator = z.boolean();
                                        break;
                                    case 'date':
                                        itemValidator = z.date();
                                        break;
                                    case 'objectid':
                                    case 'object_id':
                                        itemValidator = z.string().length(24, 'Invalid ObjectId').regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
                                        break;
                                    default:
                                        itemValidator = z.any();
                                }
                            }
                            zodValidator = z.array(itemValidator);
                        } else {
                            zodValidator = z.array(z.any());
                        }
                        break;
                    case 'objectid':
                    case 'object_id':
                        // ObjectId is a string with a fixed length of 24 characters
                        zodValidator = z.string().length(24, 'Invalid ObjectId').regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
                        break;
                    case 'object':
                        // Handle nested objects recursively
                        if (fieldProps.schema) {
                            zodValidator = createZodSchema(fieldProps.schema, options);
                        } else {
                            zodValidator = z.object({}).passthrough();
                        }
                        break;
                    case 'mixed':
                        zodValidator = z.any();
                        break;
                    case 'map':
                        // Map type - treat as object with string values
                        zodValidator = z.object({}).catchall(z.string());
                        break;
                    default:
                        throw new Error(`Invalid type: ${fieldProps.type}`);
                }
        }

        // Step 2: Apply other validators by iterating through all properties
        for (const [propName, propValue] of Object.entries(fieldProps)) {
            // Skip the 'type' and 'items' properties since they're already handled
            if (propName === 'type' || propName === 'items') {
                continue;
            }

            switch (propName) {
                case 'required':
                    // Handle required/optional fields
                    if (propValue === false) {
                        zodValidator = zodValidator.optional();
                    }
                    break;
                case 'minlength':
                case 'minLength':
                    if (zodValidator._def.type === 'string') {
                        const message = getCustomMessage(fieldName, 'minlength', propValue, customMessages) || 
                                       `${fieldName} must be at least ${propValue} characters long`;
                        zodValidator = zodValidator.min(propValue, { message });
                    }
                    break;
                case 'maxlength':
                case 'maxLength':
                    if (zodValidator._def.type === 'string') {
                        const message = getCustomMessage(fieldName, 'maxlength', propValue, customMessages) || 
                                       `${fieldName} must be at most ${propValue} characters long`;
                        zodValidator = zodValidator.max(propValue, { message });
                    }
                    break;
                case 'min':
                    if (zodValidator._def.type === 'number') {
                        zodValidator = zodValidator.min(propValue, { message: `Min value for ${fieldName} is ${propValue}` });
                    } else if (zodValidator._def.type === 'array') {
                        zodValidator = zodValidator.min(propValue, { message: `Array ${fieldName} must have at least ${propValue} items` });
                    }
                    break;
                case 'max':
                    if (zodValidator._def.type === 'number') {
                        zodValidator = zodValidator.max(propValue, { message: `Max value for ${fieldName} is ${propValue}` });
                    } else if (zodValidator._def.type === 'array') {
                        zodValidator = zodValidator.max(propValue, { message: `Array ${fieldName} must have at most ${propValue} items` });
                    }
                    break;
                case 'email':
                    if (propValue === true && zodValidator._def?.type === 'string') {
                        zodValidator = zodValidator.email({ message: `Invalid email format for ${fieldName}` });
                    }
                    break;
                case 'enum':
                    if (Array.isArray(propValue)) {
                        // Create a transform that converts input to lowercase and validates against enum
                        const lowerCaseEnum = propValue.map(val => val.toLowerCase());
                        zodValidator = z.string()
                            .toLowerCase()
                            .refine((val) => lowerCaseEnum.includes(val), {
                                message: `${fieldName} must be one of: ${propValue.join(', ')}`
                            });
                    }
                    break;
                case 'regex':
                case 'match':
                    if (zodValidator._def.type === 'string') {
                        const regex = propValue instanceof RegExp ? propValue : new RegExp(propValue);
                        let message = getCustomMessage(fieldName, 'regex', propValue, customMessages);
                        
                        // Auto-generate helpful error messages for common patterns
                        if (!message) {
                            const regexStr = regex.toString();
                            if (fieldName.toLowerCase().includes('email') || regexStr.includes('@')) {
                                message = `${fieldName} must be a valid email address`;
                            } else if (fieldName.toLowerCase().includes('password') || regexStr.includes('(?=.*\\d)')) {
                                message = `${fieldName} must contain at least one lowercase letter, one uppercase letter, one number, and one special character.`;
                            } else if (fieldName.toLowerCase().includes('phone') || regexStr.includes('\\d')) {
                                message = `${fieldName} must be a valid phone number`;
                            } else if (fieldName.toLowerCase().includes('url') || regexStr.includes('http')) {
                                message = `${fieldName} must be a valid URL`;
                            } else {
                                message = `${fieldName} format is invalid`;
                            }
                        }
                        
                        zodValidator = zodValidator.regex(regex, { message });
                    }
                    break;
                case 'default':
                    // Apply default values and make field optional if it has a default
                    if (propValue !== undefined) {
                        zodValidator = zodValidator.default(propValue);
                    }
                    break;
                case 'unique':
                    // Unique validation is typically handled at the database level, not in Zod
                    // This is more for documentation purposes
                    break;
                case 'ref':
                    // Reference validation - for now, treat as ObjectId
                    if (zodValidator._def.typeName === 'ZodString') {
                        zodValidator = z.string().length(24, 'Invalid ObjectId').regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
                    }
                    break;
            }
        }
        
        // Step 3: Apply default password regex if field is password and no custom regex specified
        if (fieldName.toLowerCase().includes('password') && 
            fieldProps.regex === undefined && 
            zodValidator._def.type === 'string') {
            const defaultPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
            const message = `${fieldName} must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&#).`;
            zodValidator = zodValidator.regex(defaultPasswordRegex, { message });
        }
        
        // Step 4: Make field optional if it has a default value and is not explicitly required
        if (fieldProps.default !== undefined && fieldProps.required !== true) {
            zodValidator = zodValidator.optional();
        }
        
        zodSchemaObject[fieldName] = zodValidator;
    }

    return z.object(zodSchemaObject);
};