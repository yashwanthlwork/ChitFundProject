// Migration: Alter interestPerPerson to ARRAY(INTEGER) in ChitSessions
//
// Best Practices:
// 1. Always check for existing data before changing column types.
// 2. Use explicit casting (USING ARRAY[column]::INTEGER[]) to preserve data.
// 3. Set sensible defaults for arrays (DEFAULT ARRAY[]::INTEGER[]).
// 4. Apply NOT NULL only after setting a default value.
// 5. Test migrations in staging before production.
// 6. Document migration intent and data handling decisions.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Change type to INTEGER[] using explicit casting to preserve existing data as single-element arrays.
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChitSessions"
      ALTER COLUMN "interestPerPerson" TYPE INTEGER[] USING ARRAY["interestPerPerson"]::INTEGER[];
    `);
    // 2. Set NOT NULL constraint after default is set.
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChitSessions"
      ALTER COLUMN "interestPerPerson" SET NOT NULL;
    `);
    // 3. Set default value to empty integer array for new rows.
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChitSessions"
      ALTER COLUMN "interestPerPerson" SET DEFAULT ARRAY[]::INTEGER[];
    `);
  },
  down: async (queryInterface, Sequelize) => {
    // Revert to INTEGER (WARNING: this will lose array data except the first element)
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChitSessions"
      ALTER COLUMN "interestPerPerson" DROP DEFAULT;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChitSessions"
      ALTER COLUMN "interestPerPerson" TYPE INTEGER USING (CASE WHEN "interestPerPerson" IS NULL OR array_length("interestPerPerson", 1) = 0 THEN 0 ELSE "interestPerPerson"[1] END);
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChitSessions"
      ALTER COLUMN "interestPerPerson" SET NOT NULL;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChitSessions"
      ALTER COLUMN "interestPerPerson" SET DEFAULT 0;
    `);
  }
};
