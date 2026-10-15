const createEmployeeValidationSchema = {
    name: {
        in: ['body'],
        trim: true,
        notEmpty: { errorMessage: 'Name is required' },
        isLength: {
            options: { max: 100 },
            errorMessage: 'Name must be at most 100 characters',
        },
    },
    age: {
        in: ['body'],
        isInt: {
            options: { min: 18, max: 100 },
            errorMessage: 'Age must be a whole number between 18 and 100',
        },
        toInt: true,
    },
    hire_date: {
        in: ['body'],
        isISO8601: {
            options: { strict: true },
            errorMessage: 'hire_date must be a valid date (YYYY-MM-DD)',
        },
    },
};

module.exports = { createEmployeeValidationSchema };