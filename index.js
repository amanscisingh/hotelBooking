const express = require("express");
const app = express();
const mongoose =  require("mongoose");
const dotenv = require("dotenv");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");

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

function isCancellable(status) {
    if (status !== 'checkedIn' && status !== 'checkedOut') {
        return true;
    } else {
        return false;
    }
}

app.engine(".hbs", exphbs({ defaultLayout: "main", extname: ".hbs", helpers: { isCancellable } }));
app.set("view engine", ".hbs");

app.use(express.static(__dirname + "/public/"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', require('./routes/home'));
app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));