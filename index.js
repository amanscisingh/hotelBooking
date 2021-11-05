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
app.use('/vicky21', require('./routes/admin'));


app.use(function(req, res, next) {
    res.status(404);
  
    // respond with html page
    if (req.accepts('html')) {
      res.render('404', { url: req.url });
      return;
    }
  
    // respond with json
    // if (req.accepts('json')) {
    //   res.json({ error: 'Not found' });
    //   return;
    // }
  
    // default to plain-text. send()
    // res.type('txt').send('Not found');
});