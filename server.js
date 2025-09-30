import express from 'express';
import dotenv from 'dotenv';
import { createSchemas } from './index.js';
import mongoose from 'mongoose';

// Example user schema definition
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
        max: 120
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
        items: { type: 'String' },
        min: 0,
        max: 10
    },
    profile: {
        type: 'Object',
        required: false
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

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/schema-builder-test');

// Create both schemas from single source of truth
const { mongooseSchema, zodSchema } = createSchemas(userSchema);

// Create Mongoose model
const User = mongoose.model('User', mongooseSchema);

const app = express();
app.use(express.json());

// Example API endpoint that uses Zod for validation
app.post('/api/users', async (req, res) => {
    try {
        // Validate request body with Zod
        const validatedData = zodSchema.parse(req.body);
        
        // Create user in database
        const user = await User.create(validatedData);
        
        res.status(201).json({
            success: true,
            data: user,
            message: 'User created successfully'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            // Handle validation errors
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors ? error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                })) : [{ field: 'unknown', message: error.message }]
            });
        } else {
            // Handle other errors (like duplicate email)
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
});

// Example endpoint to get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json({
            success: true,
            data: users,
            count: users.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Schema Builder Demo API is ready!`);
    console.log(`Try POST /api/users with user data`);
    console.log(`Try GET /api/users to see all users`);
});