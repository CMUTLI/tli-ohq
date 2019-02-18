exports.seed = (knex, Promise) => {
    return Promise.all([
        knex.insert([
            { number: 69420, name: "D A B", active: true },
            { number: 12345, name: "xd-ing for non majors", active: true }
            // also has label and color fields
        ]).into('courses')
    ]);
};