const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(async () => {
    await commonBeforeAll();
    await db.query("DELETE FROM jobs");
    await db.query(
        `INSERT INTO jobs (id, title, company_handle)
        VALUES (1111, 'J1', 'c1'),
               (2222, 'J2', 'c2')`
    );
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /jobs */

describe("GET /jobs", () => {
    test("ok for anon", async () => {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
          jobs: 
                [
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
                    }
                ]
        });
    });

    test("filters jobs by title and hasEquity = false", async () => {
        const resp = await request(app)
            .get('/jobs')
            .query({title: "j2", hasEquity: "false"});
        expect(resp.body).toEqual({
            jobs: 
                [
                    {
                        id: 2222,
                        title: "J2",
                        salary: null,
                        equity: null,
                        companyHandle: "c2"
                    }
                ]
        });
    });

    test("filters jobs by minSalary", async () => {
        const resp = await request(app)
            .get('/jobs')
            .query({minSalary: 100000});
        expect(resp.body).toEqual({
            jobs: []
        });
    });

    test("throws 400 for invalid query", async () => {
        const resp = await request(app)
            .get('/jobs')
            .query({location: "New York"});
        expect(resp.statusCode).toBe(400);
    });
})

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", () => {
    test("works for anon", async () => {
        const resp = await request(app).get('/jobs/1111');
        expect(resp.body).toEqual({
            job: {
                id: 1111,
                title: "J1",
                salary: null,
                equity: null,
                companyHandle: "c1"
            }
        });
    });

    test("throws 404 for job with invalid id", async () => {
        const resp = await request(app).get('/jobs/0');
        expect(resp.statusCode).toBe(404);
    });
})

/************************************** POST /jobs */

describe("POST /jobs", () => {
    const newJob = {
        title: "J3",
        companyHandle: "c1"
    };

    test("works for admins", async () => {
        const resp = await request(app)
            .post('/jobs')
            .send(newJob)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({
            job: {
                ...newJob,
                id: expect.any(Number),
                salary: null,
                equity: null
            }
        });
    });

    test("unauth for users", async () => {
        const resp = await request(app)
            .post('/jobs')
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toBe(401);
    });

    test("unauth for anon", async () => {
        const resp = await request(app)
            .post('/jobs')
            .send(newJob);
        expect(resp.statusCode).toBe(401);
    });

    test("bad request with missing data", async () => {
        const resp = await request(app)
            .post('/jobs')
            .send({companyHandle: "c1"})
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toBe(400);
    });
})

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", () => {
    test("works for admins", async () => {
        const resp = await request(app)
            .patch('/jobs/1111')
            .send({salary: 100000})
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({
            job: {
                id: 1111,
                title: "J1",
                salary: 100000,
                equity: null,
                companyHandle: "c1"
            }
        });
    });

    test("unauth for users", async () => {
        const resp = await request(app)
            .patch('/jobs/0')
            .send({salary: 110000})
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toBe(401);
    });

    test("unauth for anon", async () => {
        const resp = await request(app)
            .patch('/jobs/0')
            .send({salary: 120000});
        expect(resp.statusCode).toBe(401);
    });

    test("not found with invalid id", async () => {
        const resp = await request(app)
            .patch('/jobs/0')
            .send({salary: 130000})
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toBe(404);
    });

    test("bad request with attempt to change companyHandle", async () => {
        const resp = await request(app)
            .patch('/jobs/1111')
            .send({companyHandle: "c2"})
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toBe(400);
    });
})

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", () => {
    test("works for admins", async () => {
        const resp = await request(app)
            .delete('/jobs/1111')
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({deleted: "1111"});
    });

    test("unauth for users", async () => {
        const resp = await request(app)
            .delete('/jobs/1111')
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toBe(401);
    });

    test("unauth for anon", async () => {
        const resp = await request(app)
            .delete('/jobs/1111');
        expect(resp.statusCode).toBe(401);
    });

    test("not found with invalid id", async () => {
        const resp = await request(app)
            .delete('/jobs/0')
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toBe(404);
    });
})