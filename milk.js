/* load up our dependencies */
const express = require("express");
const fs = require("fs");
const mmd = require("micromarkdown");

/* set global variables */
let app = express();
let port = process.env.PORT || 3000;

/* load up the data for the blog */
var blogmeta = JSON.parse(fs.readFileSync("./blog.json", "utf8"));

/* setup the app with the necessary settings */
app.set("view engine", "ejs");
app.set("views", "./templates");
app.use(express.static("./public"));

/* home route has to read from the posts.json file and send its data
 * to a template so we can get a list of all our posts on the front
 * page */
app.get("/", (req, res) => {
    fs.readFile("./posts/posts.json", "utf8", (err, data) => {
        if (err) throw err;
        res.render("index", {blog_title: blogmeta.name, all_posts: JSON.parse(data)});
    });
});

/* each post has a unique hash that it loads from, when it 
 * is called, the post with the specified hash is requested
 * and its content is inserted into a ejs template */
app.get("/posts/:posthash", (req, res) => {
    fs.readFile("./posts/" + req.params.posthash + ".pst", "utf8", (err, data) => {
        if (err) {
            res.send("404. We're sorry, but the post you tried to access seems to be imaginary");
            return;
        }
        res.render("post", {blog_title: blogmeta.name, post_title: decodeURI(req.query.name), post_body: mmd.parse(data)});
    });
});

/* log what port we are listening on */
app.listen(port, () => {
    console.log("Listening on port " + port);
});
