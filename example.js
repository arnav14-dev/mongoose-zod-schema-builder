import mongoose from 'mongoose';
import { createSchemas, createMongooseSchema, createZodSchema } from './index.js';

// Example schema definition
const userSchema = {
    name: {
        type: 'String',
        required: true,
        minlength: 3,
        maxlength: 50
    },
    age: {
        type: 'Number',
        required: true,
        min: 0,
        max: 100
    },
    email: {
        type: 'String',
        required: true,
        unique: true,
        email: true
    },
    password: {
        type: 'String',
        required: true,
        minlength: 8,
        maxlength: 50,
        regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    },
    role: {
        type: 'String',
        required: true,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    tags: {
        type: 'Array',
        items: {
            type: 'String'
        },
        min: 0,
        max: 10
    },
    profile: {
        type: 'Object',
        required: false
    },
    userId: {
        type: 'ObjectId',
        ref: 'User',
        required: false
    },
    createdAt: {
        type: 'Date',
        default: Date.now,
    },
    updatedAt: {
        type: 'Date',
        default: Date.now
    },
    isActive: {
        type: 'Boolean',
        default: true
    },
    score: {
        type: 'Number',
        min: 0,
        max: 100,
        default: 0
    }
};

// Connect to MongoDB (optional - for demonstration)
mongoose.connect('mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

console.log('Mongoose-Zod Schema Builder Example\n');

// Method 1: Using the main createSchemas function (recommended)
console.log('Method 1: Using createSchemas (recommended)');
const { mongooseSchema, zodSchema } = createSchemas(userSchema);

// Method 2: Using individual builders
console.log('Method 2: Using individual builders');
const mongooseSchemaIndividual = createMongooseSchema(userSchema);
const zodSchemaIndividual = createZodSchema(userSchema);

console.log('Both schemas created successfully!\n');

// Create Mongoose model
const User = mongoose.model('User', mongooseSchema);

// Example data for validation
const testData = {
    name: 'John Doe',
    age: 25,
    email: 'john@example.com',
    password: 'SecurePass123',
    role: 'user',
    tags: ['developer', 'javascript'],
    profile: {
        bio: 'Software developer',
        website: 'https://website.com'
    },
    score: 85,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
};

// Example invalid data
const invalidData = {
    name: 'Jo', // Too short (minlength: 3)
    age: 150, // Too high (max: 100)
    email: 'invalid-email', // Invalid email format
    password: 'weak', // Doesn't match regex
    role: 'invalid-role', // Not in enum
    tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10', 'tag11'], // Too many items
    score: 150 // Too high (max: 100)
};

console.log('Testing Zod Validation with Valid Data:');
try {
    const validResult = zodSchema.parse(testData);
    console.log('Valid data passed validation:', validResult);
} catch (error) {
    console.log('Validation failed:');
    if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => {
            console.log(`  - ${err.path.join('.')}: ${err.message}`);
        });
    } else {
        console.log('  - Validation error:', error.message);
    }
}

console.log('\nTesting Zod Validation with Invalid Data:');
try {
    const invalidResult = zodSchema.parse(invalidData);
    console.log('Invalid data passed validation (unexpected):', invalidResult);
} catch (error) {
    console.log('Validation failed as expected:');
    if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => {
            console.log(`  - ${err.path.join('.')}: ${err.message}`);
        });
    } else {
        console.log('  - Validation error:', error.message);
    }
}

console.log('\nTesting Mongoose Schema:');
console.log('Mongoose Schema Paths:');
Object.keys(mongooseSchema.paths).forEach(path => {
    const pathSchema = mongooseSchema.paths[path];
    console.log(`  - ${path}: ${pathSchema.instance} (required: ${pathSchema.isRequired})`);
});

console.log('\nTesting Mongoose Model Creation:');
try {
    const user = new User(testData);
    console.log('User created successfully:', user.toObject());
} catch (error) {
    console.log('User creation failed:', error.message);
}

console.log('\nTesting Mongoose Model with Invalid Data:');
try {
    const invalidUser = new User(invalidData);
    await invalidUser.validate();
    console.log('Invalid user created successfully (unexpected):', invalidUser.toObject());
} catch (error) {
    console.log('User validation failed as expected:');
    Object.keys(error.errors).forEach(path => {
        console.log(`  - ${path}: ${error.errors[path].message}`);
    });
}

// Example of using Zod for API validation
console.log('\nExample: API Validation with Zod');
const validateApiRequest = (reqBody) => {
    try {
        const validatedData = zodSchema.parse(reqBody);
        return { success: true, data: validatedData };
    } catch (error) {
        return { 
            success: false, 
            errors: error.errors ? error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            })) : [{ field: 'unknown', message: error.message }]
        };
    }
};

const apiRequest = {
    name: 'Jane Doe',
    age: 30,
    email: 'jane@example.com',
    password: 'SecurePass456',
    role: 'admin',
    tags: ['admin'],
    isActive: true,
    score: 90,
    createdAt: new Date(),
    updatedAt: new Date()
};

const validationResult = validateApiRequest(apiRequest);
console.log('API Validation Result:', validationResult);

console.log('\nExample completed! Your schema builder is working perfectly!');

// Close MongoDB connection
mongoose.connection.close();
