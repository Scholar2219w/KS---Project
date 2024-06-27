const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')


const mongoose = require("mongoose")
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://localhost:27017/RestaurDB');
}
const userSchema = new mongoose.Schema({
  username:String,
  email: String,
  password: String
});
const user = mongoose.model('user', userSchema);

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  async (email) => {
    const userr = await user.findOne({email:email});
    console.log(userr);
    return userr
  },
  async (id) => {
    const userr = await user.findOne({_id:id});
    return userr
  }
)
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static("public"));


app.get('/', async (req, res) => {
  const user = await (req.user);
  const orders = await order.find();
  if((user)&&(user.username === "admin")){
    res.render('homeofadmin.ejs', {cart: orders, user:"yes"});
  }
  else{
  if(user)
  res.render('home.ejs',{user:"yes"});
  else
  res.render('home.ejs',{user:"no"});
}
});

app.get('/login', checkNotAuthenticated, async (req, res) => {
  res.render('blogin.ejs');
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('bregister.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const newuser = new user({
      email: req.body.email,
      password: hashedPassword,
      username: req.body.username
      });
      newuser.save();
    res.redirect('/login')
  } catch(err) {
    console.log(err);
    res.redirect('/register')
  }
})

app.delete('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.listen(3000,(req,res)=>{
  console.log("Server started on port 3000");
})
//AUTH done above//
const itemSchema = new mongoose.Schema({
  name: String,
  price: Number,
  imgurl: String,
  imgdesc: String,
  itemtype: String
});
const item = mongoose.model('item', itemSchema);
app.get("/menu",async function(req,res){
  const user = (await req.user);
  const founditems = await item.find();
  if(user)
  res.render("menu.ejs",{menuitems:founditems, user:"yes"});
  else
  res.render("menu.ejs",{menuitems:founditems, user:"no"});
  // console.log("here");
  // console.log(founditems);
  // console.log("here");
  // const user = (await req.user);
  // item.find({},function(err,founditems){
  //   if(!err)
  //   {
  //     if(user)
  //     res.render("menu.ejs",{menuitems:founditems, user:"yes"});
  //     else
  //     res.render("menu.ejs",{menuitems:founditems, user:"no"});
  //   }
  //   else
  //   {
  //     console.log("no");
  //     console.log(err);
  //   }
  // });
});

app.get("/home",async (req,res)=>{
  const user = (await req.user);
  if(user)
  res.render("home.ejs",{user:"yes"});
  else
  res.render("home.ejs",{user:"no"});
});

const orderSchema = new mongoose.Schema({
  itemname: [String],
  itemqty: [Number],
  address: String,
  contact: String,
  emailadd: String
});
const order = mongoose.model('order', orderSchema);
app.post("/order",checkAuthenticated,async (req,res)=>{
  const norder = new order({
    itemname: (await req.body).itemname,
    itemqty: (await req.body).itemqty,
    address: (await req.body).address,
    contact: (await req.body).contact,
    emailadd: (await req.user).email
     });
     await norder.save();
     var result=0;
     for(var i=0;i<(await req.body).itemname.length;i++)
     {
       result+=(Number(((await req.body).itemprice)[i])*Number(((await req.body).itemqty)[i]));
     }
     res.render("payment.ejs",{orderobj: norder,amounttbp:result});
   }
 );
app.get("/contact",async (req,res)=>{
  const user = (await req.user);
  if(user)
  res.render("contact.ejs",{user:"yes"});
  else
  res.render("contact.ejs",{user:"no"});
})
app.post("/orderdone",checkAuthenticated,async (req,res)=>{
  await order.findOneAndRemove({_id: await(req.body).corder});
  res.redirect("/");
})
app.get("/additems",checkAuthenticated,async (req,res)=>{
  const user = await req.user;
  if(user.username === "admin")
  {
    res.render("additems.ejs",{user:"yes"});
  }
  else
  {
    res.render("failure.ejs",{user:"no"});
  }
});
app.get("/removeitems",checkAuthenticated,async (req,res)=>{
  const user = await req.user;
  const items = await item.find();
  if(user.username === "admin")
  {
    res.render("removeitems.ejs",{useremail: user.username,menuitems: items,user:"yes"});
  }
  else
  {
    res.render("failure.ejs",{user:"no"});
  }
});
app.post("/additems",checkAuthenticated, async (req,res)=>{
  const requ = (await req.body);
  console.log(requ);
  const nitem = new item({
    name : requ.itemname,
    price : Number(requ.price),
    imgurl : requ.imgurl,
    imgdesc: requ.imgdesc,
    itemtype: requ.itemtype
  });
  await nitem.save();
  res.redirect("/additems");
});
app.post("/remove",checkAuthenticated, async (req,res)=>{
  const requ = (await req.body);
  console.log(requ);
  await item.findOneAndRemove({_id: requ.button})
  res.redirect("/removeitems");
});
app.get("/reserve",checkAuthenticated, (req,res)=>{
  res.render("reserve.ejs",{user:"yes"});
});
app.post("/reserve",(req,res)=>{
  res.redirect("/reserve");
});
app.post("/reservations",checkAuthenticated, async (req,res)=>{
  const newreservation = new reservation({
    email: (await req.user).email,
    people: (await req.body).people,
    date: (await req.body).date,
    time: (await req.body).time,
    result: "pending"
  })
  await newreservation.save();
  res.redirect("/");
})
app.post("/contact",(req,res)=>{
  res.redirect("/contact");
})
app.post("/menu",(req,res)=>{
  res.redirect("/menu");
})
app.get("/allreservs",checkAuthenticated,async (req,res)=>{
  if((await req.user).email === "admin@gmail.com"){
    res.render("reserves.ejs",{cart: (await reservation.find()), user:"yes"});
  }
  else{
    res.render("failure.ejs",{user:"no"});
  }
})

const reservationSchema = new mongoose.Schema({
  email: String,
  people: Number,
  date: String,
  time: String,
  result: String
});
const reservation = mongoose.model('reservation', reservationSchema);
app.post("/reservationdone",checkAuthenticated,async (req,res)=>{
  const id = (await req.body).corder;
  const result = (await req.body).result
  await reservation.findOneAndUpdate({_id:id},{result: result});
  res.redirect("/allreservs");
});
app.post("/showreservations",checkAuthenticated, async (req,res)=>{
  res.redirect("/showreservations");
});
app.get("/showreservations",checkAuthenticated, async (req,res)=>{
  const user = (await req.user);
  const email = user.email;
  const foundreservations = await reservation.find({email: email});
  res.render("userreservations.ejs",{name: (user.username), reservations: foundreservations, user:"yes"});
});
app.post("/userseenreserve",checkAuthenticated,async (req,res)=>{
  const id = (await req.body).id;
  await reservation.findOneAndRemove({_id: id});
  res.redirect("/showreservations");
});

const reviewSchema = new mongoose.Schema({
  email: String,
  feedback: String,
  rating: Number
});
const review = mongoose.model('review', reviewSchema);

app.get("/review", checkAuthenticated, async (req,res)=>{
  const user = (await req.user);
  res.render("review.ejs",{user:user});
});
app.post("/reviewpage",checkAuthenticated, async (req,res)=>{
  res.redirect("/review");
})
app.post("/review",checkAuthenticated, async (req,res)=>{
  const body = await req.body;
  const user = await req.user;
  var star = "";
  if(body.star1)
  {
    star = "1";
  }
  else if(body.star2)
  {
    star = "2";
  }
  else if(body.star3)
  {
    star = "3";
  }
  else if(body.star4)
  {
    star = "4";
  }
  else
  {
    star = "5";
  }
  const newreview = new review({
    email: user.email,
    feedback: body.feedback,
    rating: star
  });
  newreview.save();
  // console.log(body,user);
  res.redirect("/");
});
app.get("/reviews",checkAuthenticated,async (req,res)=>{
  const user = await req.user;
  // console.log(user);
  const foundreviews = await review.find({});
  console.log(typeof(foundreviews));
  if(user.email === "admin@gmail.com"){
    res.render("reviews.ejs",{reviews:foundreviews,user:"yes"});
  }
  else{
    res.render("failure.ejs",{user:"no"});
  }
})
app.post("/deletereview",checkAuthenticated, async (req,res)=>{
  const id= (await req.body).button;
  console.log(id);
  const user = (await req.user);
  if(user.email === "admin@gmail.com"){
    await review.findOneAndRemove({_id:id});
    res.redirect("/reviews");
  }
  else{
    res.render("failure.ejs",{user:"no"});
  }
})
app.post("/explore",(req,res)=>{
  res.redirect("/explore");
});
app.get("/explore",async (req,res)=>{
  const user = await req.user;
  const continentalitems = await item.find({itemtype: "Continental"});
  const italianitems = await item.find({itemtype: "Italian"});
  const indianitems = await item.find({itemtype: "Indian"});
  const chineseitems = await item.find({itemtype: "Chinese"});
  if(user){
    res.render("explore.ejs",{user:"yes", continentalitems: continentalitems,italianitems: italianitems,indianitems: indianitems,chineseitems: chineseitems});
  }
  else{
    res.render("explore.ejs",{user:"no", continentalitems: continentalitems,italianitems: italianitems,indianitems: indianitems,chineseitems: chineseitems});
  }
});
//
app.get("/explore/:itemid",async function(req,res){
  const user = await req.user;
  const cid=req.params.itemid;
  const fitem = await item.findOne({_id: cid});
  res.render("item.ejs",{user:user ,item: fitem})
})
app.get("/dev",(req,res)=>{
  res.render("blogin.ejs");
})
app.post("/gotoregister", (req,res)=>{
  res.redirect("/register");
})
app.post("/gotologin", (req,res)=>{
  res.redirect("/login");
})
// cloudinary
// cloud name: dmhsbpc29
// api key: 736272255537912
// api secret: iFPjBq3MQ0dv3xzonNe4gHnIuAA
//Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
