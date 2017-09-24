/* load up our dependencies */
const express = require("express");
const fs = require("fs");

/* set global variables */
let app = express();
let port = process.env.PORT || 3000;

/* load up the data for the blog */
var blogmeta = JSON.parse(fs.readFileSync("./blog.json", "utf8"));

/* setup the app with the necessary settings */
app.set("view engine", "ejs");
app.set("views", "./templates");
app.use(express.static("./public"));

/* set up the routes for the web app */
app.get("/", (req, res) => {
    fs.readFile("./posts/posts.json", "utf8", (err, data) => {
        if (err) throw err;
        res.render("index", {blog_title: blogmeta.name, all_posts: JSON.parse(data)});
    });
});

app.get("/posts/:posthash", (req, res) => {
    fs.readFile("./posts/" + req.params.posthash + ".pst", "utf8", (err, data) => {
        if (err) {
            res.send("404. We're sorry, but the post you tried to access seems to be imaginary");
            return;
        }
        res.render("post", {blog_title: blogmeta.name, post_title: decodeURI(req.query.name), post_body: data});
    });
});

app.listen(port, () => {
    console.log("Listening on port " + port);
});
