# Mongoose-Zod Schema Builder

A powerful Node.js package that solves the DRY (Don't Repeat Yourself) problem in full-stack applications by generating both Mongoose and Zod schemas from a single source of truth.

## The Problem This Solves

In full-stack applications with NoSQL databases, developers often write the same data validation rules twice:
- Once for API validation (using Zod) to provide user-friendly error messages
- Again for database modeling (using Mongoose) to ensure data integrity

This leads to:
- Code duplication
- Maintenance nightmares
- Potential bugs from inconsistencies
- Wasted development time

## The Solution

This package acts as a **translator** that takes a single, declarative schema definition and automatically generates:
- **Mongoose Schema** for database layer (data integrity, unique constraints, pre-save hooks)
- **Zod Schema** for API layer (immediate user feedback, validation messages)

### Developer-Friendly Features

**Case-Insensitive Types**: Focus on intent, not syntax. Use `String`, `string`, `STRING`, or any case combination - they all work the same way.

**Flexible ObjectId References**: Use `ObjectId`, `objectid`, `object_id`, or `OBJECT_ID` - all are supported.

**Intent-Driven Design**: The package understands what you want to achieve, not how you write it. This reduces cognitive load and prevents common capitalization errors.

### Advanced Features

**Automatic Default Password Regex**: Password fields automatically get strong validation with regex `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/` and helpful error messages.

**Smart Error Messages**: Auto-generates user-friendly error messages for common patterns (email, password, phone, URL) based on field names and regex patterns.

**Mongoose Middleware Support**: Full support for pre/post hooks, virtuals, and indexing.

**Normalized Error Handling**: Consistent error structures across different Zod versions with custom message support.

**Performance Optimization**: Built-in caching for schema generation to improve performance in production.

**Enterprise Ready**: Comprehensive edge case handling, complex nested schemas, and production-grade validation.

## Installation

```bash
npm install mongoose-zod-schema-builder
```

## Dependencies

```bash
npm install mongoose zod
```

## Quick Start

### Automatic Password Validation

```javascript
import { createSchemas } from 'mongoose-zod-schema-builder';

// Just define a password field - validation is automatic!
const userSchema = {
    username: { type: 'String', required: true, minLength: 3 },
    email: { type: 'String', required: true, email: true },
    password: { type: 'String', required: true, minLength: 8 }
    // Password gets strong validation automatically!
};

const { mongooseSchema, zodSchema } = createSchemas(userSchema);
// ✅ Password validation: 8+ chars, uppercase, lowercase, number, special char
// ✅ Smart error messages: "password must contain at least one lowercase letter..."
```

## Basic Usage

### 1. Define Your Schema (Single Source of Truth)

```javascript
// userSchema.js - Case-insensitive types for better developer experience
const userSchema = {
    name: {
        type: 'string',  // lowercase works
        required: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: 'STRING',  // uppercase works
        required: true,
        unique: true,
        email: true
    },
    age: {
        type: 'Number',  // mixed case works
        required: true,
        min: 0,
        max: 120
    },
    role: {
        type: 'string',
        required: true,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    tags: {
        type: 'array',
        items: { type: 'String' },  // mixed case in array items
        min: 0,
        max: 10
    },
    userId: {
        type: 'objectid',  // lowercase ObjectId
        ref: 'User',
        required: false
    },
    isActive: {
        type: 'boolean',  // lowercase boolean
        default: true
    }
};

export default userSchema;
```

### 2. Generate Both Schemas

```javascript
import { createSchemas } from 'mongoose-zod-schema-builder';
import userSchema from './userSchema.js';

// Generate both schemas from single definition
const { mongooseSchema, zodSchema } = createSchemas(userSchema);
```

### 3. Use in Your Application

```javascript
import mongoose from 'mongoose';

// Create Mongoose model
const User = mongoose.model('User', mongooseSchema);

// Use Zod for API validation
app.post('/api/users', async (req, res) => {
    try {
        // Validate with Zod (immediate feedback)
        const validatedData = zodSchema.parse(req.body);
        
        // Save to database with Mongoose (data integrity)
        const user = await User.create(validatedData);
        
        res.json({ success: true, data: user });
    } catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({
                errors: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
    }
});
```

## Supported Field Types

### Basic Types
- `String` or `string` - Text fields (case-insensitive)
- `Number` or `number` - Numeric fields (case-insensitive)
- `Boolean` or `boolean` - True/false values (case-insensitive)
- `Date` or `date` - Date and time (case-insensitive)
- `Array` or `array` - Collections of items (case-insensitive)
- `Object` or `object` - Nested objects (case-insensitive)
- `ObjectId`, `objectid`, or `object_id` - MongoDB ObjectId references (case-insensitive)
- `Mixed` or `mixed` - Any type (case-insensitive)

**Note**: All type definitions are case-insensitive for better developer experience. You can use `String`, `string`, `STRING`, or any combination of cases.

### Advanced Types
```javascript
const advancedSchema = {
    // String with email validation
    email: {
        type: String,
        required: true,
        email: true,
        unique: true
    },
    
    // String with regex validation
    password: {
        type: String,
        required: true,
        regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    },
    
    // Array with typed items
    tags: {
        type: Array,
        items: { type: String },
        min: 0,
        max: 10
    },
    
    // Enum validation
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
    
    // Reference to another model
    author: {
        type: 'ObjectId',
        ref: 'User',
        required: false
    },
    
    // Nested object
    profile: {
        type: Object,
        required: false
    }
};
```

## Supported Validations

### String Validations
- `required: boolean` - Field is required
- `minlength: number` - Minimum string length
- `maxlength: number` - Maximum string length
- `email: true` - Email format validation
- `regex: RegExp` - Custom regex validation
- `unique: true` - Unique constraint (Mongoose only)

### Automatic Password Validation

**Default Password Regex**: Fields with names containing "password" automatically get strong validation:

```javascript
const userSchema = {
    password: {
        type: 'String',
        required: true,
        minLength: 8
        // No custom regex needed - gets default automatically!
    }
};
```

**Default Requirements**:
- At least 8 characters
- At least one lowercase letter (a-z)
- At least one uppercase letter (A-Z)
- At least one number (0-9)
- At least one special character (@$!%*?&#)

**Custom Override**: You can still provide your own regex if needed:

```javascript
const userSchema = {
    password: {
        type: 'String',
        required: true,
        minLength: 8,
        regex: /^[a-zA-Z0-9]{8,}$/  // Custom regex overrides default
    }
};
```

### Number Validations
- `required: boolean` - Field is required
- `min: number` - Minimum value
- `max: number` - Maximum value
- `default: number` - Default value

### Array Validations
- `required: boolean` - Field is required
- `min: number` - Minimum array length
- `max: number` - Maximum array length
- `items: { type: Type }` - Define array item type

### Enum Validations
- `enum: Array` - Allowed values
- `default: value` - Default enum value

### Smart Error Messages

The schema builder automatically generates user-friendly error messages based on field names and validation patterns:

```javascript
const schema = {
    email: {
        type: 'String',
        required: true,
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        // Auto-generates: "email must be a valid email address"
    },
    password: {
        type: 'String',
        required: true,
        minLength: 8
        // Auto-generates: "password must be at least 8 characters long"
        // Plus default password regex with: "password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (multiple special characters and numbers are allowed)"
    },
    phone: {
        type: 'String',
        required: true,
        regex: /^\d{10}$/
        // Auto-generates: "phone must be a valid phone number"
    }
};
```

**Auto-Detection Patterns**:
- **Email fields**: Detects `@` symbol or field name contains "email"
- **Password fields**: Detects field name contains "password" or complex regex patterns
- **Phone fields**: Detects field name contains "phone" or `\d` patterns
- **URL fields**: Detects field name contains "url" or "http" patterns

**Custom Messages**: You can still override with custom error messages:

```javascript
const options = {
    customMessages: {
        'email.regex': 'Please provide a valid email address',
        'password.minLength': 'Password must be at least 8 characters'
    }
};

const { zodSchema } = createSchemas(schema, options);
```

## Advanced Usage

### Mongoose Middleware and Features

```javascript
import { createMongooseSchema } from 'mongoose-zod-schema-builder';

const userSchema = {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true, unique: true },
    password: { type: 'string', required: true }
};

const mongooseOptions = {
    schemaOptions: { timestamps: true, versionKey: false },
    middleware: {
        pre: {
            save: function(next) {
                // Hash password before saving
                if (this.isModified('password')) {
                    this.password = hashPassword(this.password);
                }
                next();
            }
        },
        post: {
            save: function(doc) {
                console.log('User saved:', doc.name);
            }
        }
    },
    virtuals: {
        fullName: function() {
            return this.name;
        }
    },
    indexes: {
        'email': { unique: true },
        'name': { sparse: true }
    }
};

const mongooseSchema = createMongooseSchema(userSchema, mongooseOptions);
```

### Error Handling and Custom Messages

```javascript
import { createZodSchema, normalizeZodErrors } from 'mongoose-zod-schema-builder';

const schema = {
    name: { type: 'string', required: true, minlength: 3 },
    email: { type: 'string', required: true, email: true },
    age: { type: 'number', min: 0, max: 120 }
};

const options = {
    customMessages: {
        'name.minlength': 'Name must be at least 3 characters long',
        'email.email': 'Please provide a valid email address',
        'age.min': 'Age must be a positive number'
    }
};

const zodSchema = createZodSchema(schema, options);

// Validate data
try {
    const result = zodSchema.parse(invalidData);
} catch (error) {
    const normalizedErrors = normalizeZodErrors(error);
    // normalizedErrors will have consistent structure across Zod versions
}
```

## API Reference

### `createSchemas(schemaDefinition, options)`

Creates both Mongoose and Zod schemas from a single definition.

**Parameters:**
- `schemaDefinition` (Object): The schema definition object
- `options` (Object, optional): Additional options
  - `enableCache` (boolean): Enable caching for better performance (default: true)
  - `schemaOptions` (Object): Mongoose schema options
  - `middleware` (Object): Pre/post hooks
  - `virtuals` (Object): Virtual fields
  - `indexes` (Object): Index definitions
  - `customMessages` (Object): Custom error messages
  - `strictMode` (boolean): Enable strict validation mode

**Returns:**
- `Object` with `mongooseSchema` and `zodSchema` properties

### `createMongooseSchema(schemaDefinition)`

Creates only a Mongoose schema.

**Parameters:**
- `schemaDefinition` (Object): The schema definition object

**Returns:**
- `mongoose.Schema`: A Mongoose schema object

### `createZodSchema(schemaDefinition)`

Creates only a Zod schema.

**Parameters:**
- `schemaDefinition` (Object): The schema definition object

**Returns:**
- `z.ZodObject`: A Zod schema object

## Advanced Examples

### Complete User Schema with All Features

```javascript
const completeUserSchema = {
    // Basic fields
    firstName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50
    },
    
    // Email with validation
    email: {
        type: String,
        required: true,
        unique: true,
        email: true
    },
    
    // Password with automatic strong validation
    password: {
        type: String,
        required: true,
        minlength: 8
        // No custom regex needed - gets default password validation automatically!
    },
    
    // Age with range validation
    age: {
        type: Number,
        required: true,
        min: 13,
        max: 120
    },
    
    // Role with enum
    role: {
        type: String,
        required: true,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    
    // Tags array
    tags: {
        type: Array,
        items: { type: String },
        min: 0,
        max: 20
    },
    
    // Profile object
    profile: {
        type: Object,
        required: false
    },
    
    // Reference to another user
    manager: {
        type: 'ObjectId',
        ref: 'User',
        required: false
    },
    
    // Boolean with default
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Date with default
    lastLogin: {
        type: Date,
        default: Date.now
    }
};
```

### Express.js Integration

```javascript
import express from 'express';
import { createSchemas } from 'mongoose-zod-schema-builder';
import userSchema from './schemas/userSchema.js';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Generate schemas
const { mongooseSchema, zodSchema } = createSchemas(userSchema);
const User = mongoose.model('User', mongooseSchema);

// Create user endpoint
app.post('/api/users', async (req, res) => {
    try {
        // Validate with Zod
        const validatedData = zodSchema.parse(req.body);
        
        // Create with Mongoose
        const user = await User.create(validatedData);
        
        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    }
});

// Update user endpoint
app.put('/api/users/:id', async (req, res) => {
    try {
        // Validate with Zod (partial schema)
        const validatedData = zodSchema.partial().parse(req.body);
        
        // Update with Mongoose
        const user = await User.findByIdAndUpdate(
            req.params.id,
            validatedData,
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        // Handle errors...
    }
});
```

## Benefits

### For Developers
- **DRY Principle**: Define validation rules once, use everywhere
- **Type Safety**: Full TypeScript support with Zod
- **Consistency**: Same validation logic across API and database
- **Maintainability**: Update schema in one place
- **Developer Experience**: IntelliSense and autocomplete
- **Zero Configuration**: Automatic password validation and smart error messages
- **Less Boilerplate**: No need to write complex regex patterns for common validations

### For Applications
- **Data Integrity**: Robust database validation
- **User Experience**: Immediate API feedback with helpful error messages
- **Performance**: Optimized validation at both layers
- **Security**: Consistent input sanitization with strong password requirements by default
- **Accessibility**: Clear, user-friendly error messages improve form usability

## Development

### Running the Example

```bash
# Install dependencies
npm install

# Run the example
node example.js

# Start the demo server
npm run dev
```

### Testing

```bash
# Test the package
npm test
```

## License

MIT License - feel free to use in your projects!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Made for the developer community**
