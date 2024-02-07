/**
 * @param { import("knex").Knex } knex // import knex
 * @returns { Promise<void> } // Promise<void> means that the function returns a promise that resolves to void
 */
exports.up = function (knex) {
  return knex.schema.createTable("comments", (table) => {
    table.increments("id");
    table
      .bigint("post_id")
      .references("id")
      .inTable("posts")
      .onDelete("CASCADE");
    table
      .bigint("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("message").notNullable();
    table.date("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // drop table users
  return knex.schema.dropTable("comments");
};
