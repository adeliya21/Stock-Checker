const mongoose = require("mongoose")
const db = mongoose.connect(process.env.DB, {
    useUnifiedTopology: true,
    userNewUrlParser: true,
})

module.exports = db