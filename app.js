//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const date = require(__dirname + "/date.js");

const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// create a new database 
mongoose.connect('mongodb+srv://Alan:999310@cluster0.t7cppr8.mongodb.net/todolistDB',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

// create a todolist schema 
const itemsSchema = new mongoose.Schema({
  name: String
});

// create a model 
// normally model's name should be capitalized 
// singular name of teh colleciton 
// items Schema
const Item = mongoose.model("Item", itemsSchema);

// create documents 
const item1 = new Item({
  name: "Welcome to your todo list",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};




const List = mongoose.model("List", listSchema);

// insert those 3 documents 
// error : Model.insertMany() no longer accepts a callback
// Item.insertMany(defaultItems)
//   .then(() => {
//     console.log("successfully saved default items into todoDB");
//   })
//   .catch(err => {
//     console.log(err);
//   });



app.post("/delete", function (req, res) {
  // mongoose find by id and remove the elements from DB
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        // console.log("Successfully deleted checked items");
        res.redirect("/");
      })
      .catch(err => {
        console.error("Error removing item:", err);
        res.status(500).send("Internal Server Error");
      });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.error("Error updating list:", err);
        res.status(500).send("Internal Server Error");
      });
  }
  // console.log(req.body.checkbox);
})




// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
// error : MongooseError: Model.find() no longer accepts a callback
app.get("/", function (req, res) {
  // find all items 
  Item.find({}).then(foundItems => {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems)
        .then(() => {
          console.log("successfully saved default items into todoDB");
        })
        .catch(err => {
          console.log(err);
        });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
    console.log(foundItems);
  }).catch(err => {
    console.log(err);
    res.status(500).send("Internal Server Error");
  });
});

// create ur own list 
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // return one document if it found the name 
  List.findOne({ name: customListName })
    .then(foundList => {
      if (!foundList) {
        // console.log(`No list found with the name: ${customListName}. Creating a new one.`);
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // console.log(`List found with the name: ${customListName}`);
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });

      }
    })
    .catch(err => console.log(err));


});






app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;



  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }

  // use mongoDB
  const item = new Item({
    name: itemName
  });

  if (listName == "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(foundList => {
        foundList.items.push(item);
        foundList.save().then(() => {
          res.redirect("/" + listName);
        }).catch(err => {
          console.error("Error saving the list:", err);
          res.status(500).send("Internal Server Error");
        });
      })
      .catch(err => {
        console.error("Error finding the list:", err);
        res.status(500).send("Internal Server Error");
      });

  }


});





app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function () {
  console.log("Server started on port 3000");
});
