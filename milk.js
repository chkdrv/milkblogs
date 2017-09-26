/* load up our dependencies */
const express = require("express");
const fs = require("fs");
const mmd = require("micromarkdown");
const bodyparser = require("body-parser");
const crypto = require("crypto");

/* set global variables */
let app = express();
let port = process.env.PORT || 3000;

/* load up the data for the blog */
var blogmeta = JSON.parse(fs.readFileSync("./blog.json", "utf8"));

/* setup the app with the necessary settings */
app.set("view engine", "ejs");
app.set("views", "./templates");
app.use(express.static("./public"));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: true
}));

/* home route has to readfrom the posts.json file and send its data
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
app.get("/post/:posthash", (req, res) => {
    fs.readFile("./posts/" + req.params.posthash + ".pst", "utf8", (err, data) => {
        if (err) {
            res.send("404. We're sorry, but the post you tried to access seems to be imaginary.");
            return;
        }
        res.render("post", {blog_title: blogmeta.name, post_title: decodeURI(req.query.name), post_body: mmd.parse(data)});
    });
});

/* Admin panel for editing and saving posts */
app.get("/control-panel/", (req, res) => {
    fs.readFile("./posts/posts.json", "utf8", (err, data) => {
        if (err) {
            res.send(err);
            return;
        }
        res.render("controlpanel", {blog_title: blogmeta.name, all_posts: JSON.parse(data)});
    });
});

/* editing a post */
app.get("/control-panel/edit/:posthash", (req, res) => {
    fs.readFile("./posts/" + req.params.posthash + ".pst", "utf8", (err, data) => {
        res.render("posteditor", {hash: req.params.posthash, post_content: data, post_title: decodeURI(req.query.name)});
    });
});

/* creating a new post */
app.get("/control-panel/compose", (req, res) => {
    console.log("composing");
    res.render("posteditor", {hash: "", post_content: "", post_title: ""});
});

/* saving a post to filesystem */
app.post("/fs/savepost", (req, res) => {
    if (req.body.newpost !== "yes") {
        fs.writeFile("./posts/" + req.body.hash + ".pst", req.body.content, (err) => {
            if (err) throw err;
            fs.readFile("./posts/posts.json", "utf8", (err, data) => {
                let d = JSON.parse(data);
                for(var i=0; i<d.length; i++) {
                    if(d[i].hash == req.body.hash) {
                        d[i].title = req.body.title;
                        d[i].small = (req.body.content.length < 200) ? req.body.content : req.body.content.substring(0, 200) + "...";
                    }
                }

                fs.writeFile("./posts/posts.json", JSON.stringify(d), (err) => {
                    if (err) throw err;
                    res.redirect("/control-panel");
                });
            });
        });
    } else {
        let h = crypto.randomBytes(4).toString('hex');
        fs.writeFile("./posts/" + h + ".pst", req.body.content, (err) => {
            if(err) throw err;
            fs.readFile("./posts/posts.json", "utf8", (err, data) => {
                if (err) throw err;
                let d = JSON.parse(data);
                var now = new Date();
                d.push({
                    title: req.body.title,
                    date: now.getDate() + "-" + now.getMonth() + "-" + now.getFullYear(),
                    hash: h,
                    small: req.body.content.substring(0, 200) + "..."
                });
                fs.writeFile("./posts/posts.json", JSON.stringify(d), (err) => {
                    if (err) throw err;
                    res.redirect("/control-panel");
                });
            });
        });
    }
});

/* log what port we are listening on */
app.listen(port, () => {
    console.log("Listening on port " + port);
});
