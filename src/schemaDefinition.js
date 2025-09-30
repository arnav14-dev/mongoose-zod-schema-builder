import { createSchemas } from '../index.js';

// Example schema definition - you can replace this with your own schema
const exampleSchema = {
    name: {
        type: 'String',
        required: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: 'String',
        required: true,
        unique: true,
        email: true
    },
    age: {
        type: 'Number',
        required: true,
        min: 0,
        max: 120
    }
};

// Create both schemas from the single source of truth
const { mongooseSchema, zodSchema } = createSchemas(exampleSchema);

export { mongooseSchema, zodSchema };
export default exampleSchema;

