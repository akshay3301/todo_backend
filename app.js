const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

var todoItems = [];
let workItems = [];
var day;
var daysOfWeek = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
mongoose.connect(
  "mongodb+srv://hsakshay:user123@cluster0.3og7qcg.mongodb.net/todolistDB"
);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "food",
});

const item2 = new Item({
  name: "gym",
});

const defaultItems = [item1, item2];

const listSchem = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchem);

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", function (req, res) {
  var currentDay = new Date();
  var options = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  Item.find()
    .then((items) => {
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then((items) => {
            console.log("successful");
          })
          .catch((err) => {
            console.err(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: day, addItem: items });
      }
    })
    .catch((err) => {
      console.error(err);
    });
  day = daysOfWeek[currentDay.getDay()];
});

app.post("/", function (req, res) {
  var todoItem = req.body.todo;
  const listName = req.body.list;
  const item = new Item({
    name: todoItem,
  });

  if (day === listName) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          addItem: foundList.items,
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

app.post("/delete", function (req, res) {
  const checkedItem = req.body.checkbox;

  const listName = req.body.listName;
  if (day === listName) {
    Item.findByIdAndRemove(checkedItem)
      .then(() => {
        console.log("deleted");
        res.redirect("/");
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItem } } }
    )
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

app.listen(3000, function () {
  console.log("server started !");
});
