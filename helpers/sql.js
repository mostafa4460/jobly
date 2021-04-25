const { BadRequestError } = require("../expressError");

/** Returns the 'SET' part of a query update and its sanitized values for a given resource
 * 
 * Takes an obj of the new data and an obj of the SQL columns that need to be renamed to JS,
 * which differs from table to table.
 * 
 * If no data was given to update, throw BadRequestError.
 * 
 * EX for User update:
 * 
 * sqlForPartialUpdate({firstName: "Test", lastName: "User"},
 * {firstName: "first_name",
 *  lastName: "last_name", 
 *  isAdmin: "is_admin"}) ===> {
 *                              setCols: "first_name"=$1, "last_name"=$2,
 *                              values: ["Test", "User"]
 *                             }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
