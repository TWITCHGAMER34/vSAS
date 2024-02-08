/**
 * @param { import("knex").Knex } knex // import knex
 * @returns { Promise<void> } // Promise<void> means that the function returns a promise that resolves to void
 */
exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
    // create table users
    table.increments("id");
    table.string("username").unique().notNullable();
    table.string("email").unique().notNullable();
    table.string("password").notNullable();
    table.string("role");
    table.boolean("is_active").defaultTo(false);
    table.date("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // drop table users
  return knex.schema.dropTable("users");
};
