const db = require("../db");
const {NotFoundError} = require("../expressError");
const {sqlForPartialUpdate} = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Find all jobs
     * 
     * Accepts a query obj and can filter by:
     * - hasEquity (if true, find jobs that provide a non-zero amount of equity)
     * - minSalary
     * - title (will find case-insensitive, partial matches)
     * 
     * Returns [{id, title, salary, equity, companyHandle}, ...]
    */

    static async findAll(query = null) {
        let jobsRes;

        if (!query) {
            jobsRes = await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs`);
        } else {
            const whereCols = [];
            const values = [];
            
            Object.entries(query).forEach(([k, v], i) => {
                if (k === "title") {
                    whereCols.push(`"title" ILIKE '%' || $${i + 1} || '%'`);
                    values.push(v);
                } else if (k === "minSalary") {
                    whereCols.push(`"salary" >= $${i + 1}`);
                    values.push(v);
                } else if (k === "hasEquity" && v === true) {
                    whereCols.push(`"equity" > $${i + 1}`);
                    values.push(0);
                }
            });

            jobsRes = await db.query(
                `SELECT id, title, salary, equity, company_handle AS "companyHandle" 
                FROM jobs
                WHERE ${whereCols.join(' AND ')}`, values);
        }
        return jobsRes.rows;
    }

    /** Creates a new job from `DATA`, adds it to DB, returns new job data
     * 
     * `DATA` should be: {title, salary, equity, companyHandle}
     * 
     * Returns {id, title, salary, equity, companyHandle}
    */

    static async create({title, salary, equity, companyHandle}) {
        const job = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [title, salary, equity, companyHandle]
        );
        return job.rows[0];
    }

    /** Given a job id, return data about that job
     * 
     * Returns {id, title, salary, equity, companyHandle}
     * 
     * Throws NotFoundError if not found. 
    */

    static async get(id) {
        const res = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
            [id]
        );
        const job = res.rows[0];
        if (!job) throw new NotFoundError(`No job: ${id}`);
        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
    */

    static async update(id, data) {
        const {setCols, values} = sqlForPartialUpdate(data, {companyHandle: "company_handle"});
        const idIndx = values.length + 1;
        const res = await db.query(
            `UPDATE jobs SET ${setCols}
            WHERE id = $${idIndx}
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [...values, id]
        );
        const job = res.rows[0];
        if (!job) throw new NotFoundError(`No job: ${id}`);
        return job;
    }

    /** Delete given job from database; returns undefined. 
     * 
     * Throws NotFoundError if company not found.
    */

    static async remove(id) {
        const res = await db.query(
            `DELETE FROM jobs 
            WHERE id = $1
            RETURNING id`, 
            [id]
        );
        if (res.rows.length === 0) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;