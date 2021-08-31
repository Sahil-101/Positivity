const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
const port = 3000;

app.get("/",(req, res)=>{
    res.sendFile(__dirname+"/index.html");
})

app.post("/",(req, res)=>{
    console.log(req.body);
    res.send("ok"); 
})

app.listen(port, () => {
    console.log("Successfully running on port "+port);
})