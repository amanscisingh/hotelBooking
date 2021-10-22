const express = require("express");
const app = express();
const mongoose =  require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const RazorPay = require("razorpay");

const razorpay = new RazorPay({
    key_id: "rzp_test_25WThwSFtdt8wf",
    key_secret: "L3Zq82uskZJJ3thFvBxB4DVL"
});

dotenv.config({ path: "./config/.env" });

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=> {
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT} and mongoDB connected!!!`);
    })
})

app.engine(".hbs", exphbs({ defaultLayout: "main", extname: ".hbs" }));
app.set("view engine", ".hbs");

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', require('./routes/home'));