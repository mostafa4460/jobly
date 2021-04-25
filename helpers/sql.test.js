const { sqlForPartialUpdate } = require("./sql");

describe("Tests for sqlForPartialUpdate()", () => {
    test("Returns the 'SET' part of a User update query", () => {
        const data = {firstName: "Test", lastName: "User"};
        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name", 
            isAdmin: "is_admin"
        };
        expect(sqlForPartialUpdate(data, jsToSql)).toEqual({
            setCols: `"first_name"=$1, "last_name"=$2`,
            values: ["Test", "User"]
        });
    })
    
    test("Returns the 'SET' part of a Company update query", () => {
        const data = {name: "Test", numEmployees: 10};
        const jsToSql = {
            numEmployees: "num_employees",
            logoUrl: "logo_url"
        };
        expect(sqlForPartialUpdate(data, jsToSql)).toEqual({
            setCols: `"name"=$1, "num_employees"=$2`,
            values: ["Test", 10]
        });
    })
})