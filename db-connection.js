const mongoose = require("mongoose")

const db = async () => {
    try {
      await mongoose.connect(process.env.DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Successfully connected to the database.");
    } catch (error) {
      console.error("Error connecting to the database:", error.message);
      process.exit(1); // Exit the process with an error code
    }
  };

// const db = mongoose.connect(process.env.DB, {
//     useUnifiedTopology: true,
//     useNewUrlParser: true,
// })

module.exports = db