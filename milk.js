/* load up our dependencies */
const express = require("express");
const fs = require("fs");
const showdown = require("showdown");
const bodyparser = require("body-parser");
const crypto = require("crypto");

/* set global variables */
var app = express();
var port = process.env.PORT || 3000;
var converter = new showdown.Converter();

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
    res.render("post", {
      blog_title: blogmeta.name, 
      post_title: decodeURI(req.query.name), 
      post_body: converter.makeHtml(data)
    });
  });
});

/* Admin panel for editing and saving posts */
app.get("/control-panel/", (req, res) => {
  fs.readFile("./posts/posts.json", "utf8", (err, data) => {
    if (err) throw err;
    res.render("controlpanel", {blog_meta: blogmeta, all_posts: JSON.parse(data)});
  });
});

/* editing a post */
app.get("/control-panel/edit/:posthash", (req, res) => {
  fs.readFile("./posts/" + req.params.posthash + ".pst", "utf8", (err, data) => {
    res.render("posteditor", {
      hash: req.params.posthash, 
      post_content: data, 
      post_title: decodeURI(req.query.name), 
      new_post: false
    });
  });
});

/* creating a new post */
app.get("/control-panel/compose", (req, res) => {
  res.render("posteditor", {
    hash: crypto.randomBytes(4).toString('hex'), 
    post_content: "", 
    post_title: "", 
    new_post: true
  });
});

/* update blog.json */
app.post("/fs/updateblogmeta", (req, res) => {
  if (req.body.chksecret === blogmeta.secret) {
    console.log(req.body);
    var d = req.body;
    delete d.chksecret;
    if (d.secret === "") d.secret = blogmeta.secret;
    fs.writeFile("blog.json", JSON.stringify(d), (err) => {
      if (err) throw err;
      console.log(d);
      blogmeta = d;
      res.redirect("/control-panel");
    });
  } else res.end("Secret not correct");
});

/* delete a post */
app.post("/fs/deletepost", (req, res) => {
  if (req.body.secret === blogmeta.secret) {
    fs.unlink("./posts/" + req.body.hash + ".pst", (err) => {
      if (err) throw err;
      fs.readFile("./posts/posts.json", "utf8", (err, data) => {
        if (err) throw err;
        let d = JSON.parse(data);
        for(var i=0; i<d.length; i++) {
          if(d[i].hash == req.body.hash) {
            d.splice(i, 1);
          }
        }

        fs.writeFile("./posts/posts.json", JSON.stringify(d), (err) => {
          if (err) throw err;
          res.redirect("/control-panel");
        });
      }); 
    });
  } else {
    res.end("Secret not correct");
  }
});

/* helper function to get the short of a post */
function getshort(c) {
  if (c.length < 200) return c;
  else return (c.substring(0, 200) + "...");
}

/* saving a post to filesystem */
app.post("/fs/savepost", (req, res) => {
  if (req.body.secret === blogmeta.secret){
    if (req.body.delpost === "yes") {
      res.redirect(307, "/fs/deletepost");
    } else {
      fs.writeFile("./posts/" + req.body.hash + ".pst", req.body.content, (err) => {
        if (err) throw err;
        fs.readFile("./posts/posts.json", "utf8", (err, data) => {
          var d = JSON.parse(data);

          if (req.query.new !== "yes") {
            for(var i=0; i<d.length; i++) {
              if(d[i].hash == req.body.hash) {
                d[i].title = req.body.title;
                d[i].small = getshort(req.body.content);
              }
            }
          } else {
            var now = new Date();
            d.push({
              title: req.body.title,
              date: now.getDate() + "-" + now.getMonth() + "-" + now.getFullYear(),
              hash: req.body.hash,
              small: getshort(req.body.content)
            });
          }

          fs.writeFile("./posts/posts.json", JSON.stringify(d), (err) => {
            if (err) throw err;
            res.redirect("/control-panel");
          });
        });
      });
    }
  } else res.end("Secret not correct");
});

/* log what port we are listening on */
app.listen(port, () => {
  console.log("Listening on port " + port);
});
