const express = require("express");
const router = new express.Router();
const Job = require("../models/job");
const {ensureIsAdmin} = require("../middleware/auth");
const jsonschema = require("jsonschema");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobQuerySchema = require("../schemas/jobQuery.json");
const {BadRequestError} = require("../expressError");
const db = require("../db");

/** GET /  =>
 *      {jobs: [ {id, title, salary, equity, company_handle}, ...] }
 * 
 * Can filter on provided search filters:
 * - hasEquity (if true, find jobs that provide a non-zero amount of equity)
 * - minSalary
 * - title (will find case-insensitive, partial matches)
 * 
 * Authorization required: None 
*/

router.get('/', async (req, res, next) => {
    try {
        let jobs;

        if (Object.keys(req.query).length === 0) {
            jobs = await Job.findAll();
        } else {
            // convert minSalary to integer if present in query
            if (req.query["minSalary"]) req.query.minSalary = +req.query.minSalary;
            // convert hasEquity to boolean if present in query (defaults to false if anything but "true")
            if (req.query["hasEquity"]) {
                if (req.query.hasEquity === "true") req.query.hasEquity = true;
                else req.query.hasEquity = false;
            }

            const validator = jsonschema.validate(req.query, jobQuerySchema);
            if (!validator.valid) {
                const errs = validator.errors.map(e => e.stack);
                throw new BadRequestError(errs);
            }
            jobs = await Job.findAll(req.query);
        }
        return res.json({ jobs });
    } catch(e) {
        return next(e);
    }
})

/** POST /  { job } => { job }
 * 
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: Admin       
*/

router.post('/', ensureIsAdmin, async (req, res, next) => {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch(e) {
        return next(e);
    }
})

/** GET /[id] => { job } 
 * 
 * job is {id, title, salary, equity, companyHandle}
 * 
 * Authorization required: none
*/

router.get('/:id', async (req, res, next) => {
    try {
        const job = await Job.get(req.params.id);
        return res.json({job});
    } catch(e) {
        return next(e);
    }
})

/** PATCH /[id] { fld1, fld2, ... } => { job } 
 * 
 * Patches job data.
 * 
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: Admin
*/

router.patch('/:id', ensureIsAdmin, async (req, res, next) => {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Job.update(req.params.id, req.body);
        return res.json({job});
    } catch(e) {
        return next(e);
    }
})

/** DELETE /[id]  => { deleted: id } 
 * 
 * Authorization required: Admin
*/

router.delete('/:id', ensureIsAdmin, async (req, res, next) => {
    try {
        const {id} = req.params;
        await Job.remove(id);
        return res.json({deleted: id});
    } catch(e) {
        return next(e);
    }
})

module.exports = router;