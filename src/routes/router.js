const { Router } = require('express');
const employeesRouter = require('./employees');

const router = Router()

router.use(employeesRouter);

module.exports = router