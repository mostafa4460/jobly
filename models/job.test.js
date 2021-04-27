const db = require("../db");
const Job = require("../models/job");
const {NotFoundError} = require("../expressError");

beforeAll(async () => {
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM jobs");
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM companies");

    await db.query(`
        INSERT INTO companies(handle, name, num_employees, description, logo_url)
        VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
            ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
            ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

    await db.query(`
        INSERT INTO jobs(id, title, company_handle)
        VALUES ('1111', 'J1', 'c1'),
            ('2222', 'J2', 'c2'),
            ('3333', 'J3', 'c3')`);
});
beforeEach(async () => await db.query("BEGIN"));
afterEach(async () => await db.query("ROLLBACK"));
afterAll(async () => await db.end());

/*************************** findAll */

describe("findAll", () => {
    test("works: no filter", async () => {
        const jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: 1111,
                title: "J1",
                salary: null,
                equity: null,
                companyHandle: "c1"
            },
            {
                id: 2222,
                title: "J2",
                salary: null,
                equity: null,
                companyHandle: "c2"
            },
            {
                id: 3333,
                title: "J3",
                salary: null,
                equity: null,
                companyHandle: "c3"
            }
        ])
    });

    test("works: filter by title and hasEquity = false", async () => {
        const jobs = await Job.findAll({title: "j3", hasEquity: "false"});
        expect(jobs).toEqual([
            {
                id: 3333,
                title: "J3",
                salary: null,
                equity: null,
                companyHandle: "c3"
            }
        ])
    });

    test("works: filter by minSalary", async () => {
        const jobs = await Job.findAll({minSalary: 100000});
        expect(jobs).toEqual([]);
    });
})

/******************************* create */

describe("create", () => {
    const newJob = {
        title: "J4",
        salary: 120000,
        equity: 0.5,
        companyHandle: "c3"
    }

    test("works", async () => {
        const res = await Job.create(newJob);
        expect(res).toEqual({
            id: expect.any(Number),
            title: "J4",
            salary: 120000,
            equity: "0.5",
            companyHandle: "c3"
        })
    });
})

/******************************* get */

describe("get", () => {
    test("works", async () => {
        const res = await Job.get(1111);
        expect(res).toEqual({
            id: 1111,
            title: "J1",
            salary: null,
            equity: null,
            companyHandle: "c1"
        });
    });

    test("throws NotFoundError if not found", async () => {
        try {
            const res = await Job.get(0);
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy();
        }
    });
})

/******************************* update */

describe("update", () => {
    test("works", async () => {
        const res = await Job.update(1111, {salary: 50000});
        expect(res).toEqual({
            id: 1111,
            title: "J1",
            salary: 50000,
            equity: null,
            companyHandle: "c1"
        })
    });

    test("throws NotFoundError if not found", async () => { 
        try {
            const res = await Job.update(0, {salary: 50000});
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy();
        }
    });
})

/******************************* remove */

describe("remove", () => {
    test("works", async () => {
        await Job.remove(1111);
        const res = await db.query("SELECT id FROM jobs WHERE id = 1111");
        expect(res.rows.length).toBe(0);
    });

    test("throws NotFoundError if not found", async () => { 
        try {
            await Job.remove(0);
        } catch(e) {
            expect(e instanceof NotFoundError).toBeTruthy();
        }
    });
})    