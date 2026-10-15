const { Router } = require('express');
const { checkSchema, matchedData, validationResult } = require('express-validator');
const db = require('../db');
const { createEmployeeValidationSchema } = require('../utils/employeesValidationSchemas');

const router = Router();

// Fields allowed in ?filter=...&value=...
const FILTERABLE_FIELDS = ['name'];
// Fields allowed in PATCH
const PATCHABLE_FIELDS = ['name', 'age', 'hire_date'];

// Escape % _ \ so user input is matched literally by ILIKE
const escapeLike = (str) => str.replace(/[\\%_]/g, '\\$&');

// Runs automatically for every route that has :id
router.param('id', (req, res, next, id) => {
    if (!/^\d+$/.test(id)) {
        return res.status(400).send({ msg: 'Invalid employee id' });
    }
    next();
});

// GET all employees, optional filter
router.get('/api/employees', async (req, res) => {
    try {
        const { filter, value } = req.query;
        let text = 'SELECT * FROM public.employees';
        const params = [];

        if (filter && value) {
            if (!FILTERABLE_FIELDS.includes(filter)) {
                return res.status(400).send({ msg: `Cannot filter by "${filter}"` });
            }
            // filter is whitelisted above, so it's safe to put in the SQL text
            text += ` WHERE ${filter} ILIKE $1`;
            params.push(`%${escapeLike(String(value))}%`);
        }

        text += ' ORDER BY id';
        const result = await db.query(text, params);
        return res.send(result.rows);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ msg: 'Server error' });
    }
});

// GET one employee
router.get('/api/employees/:id', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM public.employees WHERE id = $1',
            [req.params.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).send({ msg: 'Employee Not Found' });
        }
        return res.send(result.rows[0]);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ msg: 'Server error' });
    }
});

// CREATE employee
router.post('/api/employees',
    checkSchema(createEmployeeValidationSchema),
    async (req, res) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).send({ error: result.array() });
        }

        const { name, age, hire_date } = matchedData(req);

        try {
            const saved = await db.query(
                `INSERT INTO public.employees (name, age, hire_date, created_at, updated_at)
                 VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE)
                 RETURNING *`,
                [name, age, hire_date]
            );
            return res.status(201).send(saved.rows[0]);
        } catch (err) {
            console.log(err);
            if (err.code === '23505') { // unique_violation
                return res.status(409).send({ msg: 'Employee already exists' });
            }
            return res.status(400).send({ msg: 'Employee not Saved' });
        }
    }
);

// PUT: replace the whole employee (all fields required)
router.put('/api/employees/:id',
    checkSchema(createEmployeeValidationSchema),
    async (req, res) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).send({ error: result.array() });
        }

        const { name, age, hire_date } = matchedData(req);

        try {
            const updated = await db.query(
                `UPDATE public.employees
                 SET name = $1, age = $2, hire_date = $3, updated_at = CURRENT_DATE
                 WHERE id = $4
                 RETURNING *`,
                [name, age, hire_date, req.params.id]
            );
            if (updated.rowCount === 0) {
                return res.status(404).send({ msg: 'Employee Not Found' });
            }
            return res.status(200).send({ msg: 'Employee Updated', employee: updated.rows[0] });
        } catch (err) {
            console.log(err);
            if (err.code === '23505') {
                return res.status(409).send({ msg: 'Employee already exists' });
            }
            return res.status(400).send({ msg: 'Employee not Updated' });
        }
    }
);

// PATCH: update only the fields sent
router.patch('/api/employees/:id', async (req, res) => {
    const updates = {};
    for (const field of PATCHABLE_FIELDS) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
        return res.status(400).send({ msg: 'No valid fields to update' });
    }

    // Build "name = $1, age = $2 ..." from the whitelisted field names only
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = fields.map((f) => updates[f]);
    values.push(req.params.id);

    try {
        const updated = await db.query(
            `UPDATE public.employees
             SET ${setClause}, updated_at = CURRENT_DATE
             WHERE id = $${values.length}
             RETURNING *`,
            values
        );
        if (updated.rowCount === 0) {
            return res.status(404).send({ msg: 'Employee Not Found' });
        }
        return res.status(200).send({ msg: 'Employee Updated', employee: updated.rows[0] });
    } catch (err) {
        console.log(err);
        if (err.code === '23505') {
            return res.status(409).send({ msg: 'Employee already exists' });
        }
        // 22xxx = bad data (e.g. invalid date or integer)
        return res.status(400).send({ msg: 'Employee not Updated' });
    }
});

// DELETE employee
router.delete('/api/employees/:id', async (req, res) => {
    try {
        const deleted = await db.query(
            'DELETE FROM public.employees WHERE id = $1',
            [req.params.id]
        );
        if (deleted.rowCount === 0) {
            return res.status(404).send({ msg: 'Employee Not Found' });
        }
        return res.status(200).send({ msg: 'Employee Deleted' });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ msg: 'Server error' });
    }
});

module.exports = router;