/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("verification", (table) => {
    // create table users
    table.increments("id");
    table
      .bigint("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("email").notNullable();
    table.string("code").notNullable();
    table.date("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // drop table users
  return knex.schema.dropTable("verification");
};
