//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://{your username}:{your password}@cluster0.ab7cf.mongodb.net/test?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
  }
);
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today",newListItems: foundItems});
    }
  });
});


app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        console.log("Exists!");
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();

      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  // const checkedItemID = req.body.checkbox;
  // const listName = req.body.listName;
  //
  // if (listName === "Today") {
  //   Item.findByIdAndRemove(checkedItemID, function(err) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log("Successfully deleted");
  //       res.redirect("/");
  //     }
  //   });
  // } else {
  //   List.findOneAndUpdate({
  //     name: listName
  //   }, {
  //     $pull: {
  //       items: {
  //         _id: checkedItemID
  //       }
  //     }
  //   }, function(err, foundList) {
  //     if (!err) {
        // res.redirect("/" + listName);
  //     }
  //   });
  // }

  if (req.body.checkbox) {
    const obj = JSON.parse(req.body.checkbox);
    console.log(obj.listName, obj.itemName, obj.itemId);

    if (obj.listName === "Today") {
      Item.findByIdAndRemove(obj.itemId, function(err) {
        if (!err) {
          console.log("Successfully deleted");
          res.redirect("/");
        } else {
          console.log(err);
        }
      })
    } else {
      List.findOneAndUpdate({
        name: obj.listName
      }, {
        $pull: {
          items: {
            _id: obj.itemId
          }
        }
      }, function(err, foundList) {
        if (!err) {
          res.redirect('/' + obj.listName);
        }
      })
    }
  }

});

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
