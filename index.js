const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const client = require("@mailchimp/mailchimp_marketing");
const md5 = require("md5");
const { response } = require("express");

const app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
const port = 3000;
client.setConfig({
    apiKey: "d131391dc7f8ea9302e61c987ea09603-us5",
    server: "us5",
})
const listId = "7a72e8ae47";

app.get("/",(req, res)=>{
    res.sendFile(__dirname+"/index.html");    
})

app.post("/",(req, res)=>{

    console.log(req.body);

    var data = {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    }
    const hash_email = md5(data.email.toLowerCase());
    console.log(hash_email);
    
    async function update_subscribe(){
            const response = await client.lists.setListMember(
              listId,
              hash_email,
              { email_address: data.email, status: "subscribed"}
            );
            res.sendFile(__dirname+"/successful.html");
          };

    async function run(){   
        try{
        response = await client.lists.addListMember(listId,{
            email_address: data.email,
            status: "subscribed",
            merge_fields: {
                FNAME: data.firstName,
                LNAME: data.lastName
            }
        });

        res.sendFile(__dirname+"/successful.html");

        }
        catch(error)
        {
            console.log(error);
        }
      };

    if(req.body.button=="1")
    {
        async function check_and_subcribe(){   
            try{
                const response = await client.lists.getListMember(
                    listId,
                    hash_email
                );
                if(response.status=="subscribed")
                {
                    res.sendFile(__dirname+"/already_exist.html")
                }
                else{
                    update_subscribe();
                }
            }
            catch(error)
            {
                if(error == 404)
                {
                    run();
                }
            }
          };
        check_and_subcribe();
    }
    else{
        async function unsubscribe(){
            try{
            const response = await client.lists.updateListMember(
                listId,
                hash_email,
                {
                  status: "unsubscribed"
                }
              );
            }
            catch(error)
            {
                if(error.statusCode == 404)
                {
                    res.send("not a subscriber");
                }
            }
        }

        unsubscribe();
        res.sendFile(__dirname+"/unsubscribed.html");
    }
})






app.listen(port, () => {
    console.log("Successfully running on port "+port);
})


//api_key d131391dc7f8ea9302e61c987ea09603-us5

//List_id 7a72e8ae47