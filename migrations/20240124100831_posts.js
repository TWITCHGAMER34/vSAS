/**
 * @param { import("knex").Knex } knex // import knex
 * @returns { Promise<void> } // Promise<void> means that the function returns a promise that resolves to void
 */
exports.up = function (knex) {
  return knex.schema.createTable("posts", (table) => {
    table.increments("id");
    table
      .bigint("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("title").notNullable();
    table.string("content").notNullable();
    table.string("image_url").nullable();
    table.date("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // drop table users
  return knex.schema.dropTable("posts");
};
