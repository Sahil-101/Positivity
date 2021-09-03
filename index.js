const express = require("express");
//body parser MIDDLEWARE for getting json object of things passed while post request in the form
const bodyParser = require("body-parser");
//mailchimp api which is used for sending mails.
const client = require("@mailchimp/mailchimp_marketing");
//hashing package required by mailchimp api
const md5 = require("md5");
//https module to fetch data from the quotes api
const https = require("https");

//Message which is to be sent through mail
var MESSAGE;
//time at which mail has to be sent
const hour = 8;
const minute = 55;

//express instance
const app = express();
//body extended = true says that body.content can contain other data except strings
app.use(bodyParser.urlencoded({ extended: true }));
//for serving static files like styles.css we have to specify this
// and store all static files in a public folder

app.use(express.static("public"));

//specifing which port app should run(locally)
const port = 3000;
//configuring mailchimp api with authentication apiKey
client.setConfig({
    apiKey: "d131391dc7f8ea9302e61c987ea09603-us5",
    server: "us5",
})
//the list id of our audience in which they would be added and to who mail is sent
const listId = "7a72e8ae47";

//creates new campaing(main mail which is to be sent) with given settings and 
//and sets the content of the mail to the MESSAGE string
//and after completion sends the mail as well
const update_content = async (MESSAGE) => {

    const response = await client.campaigns.create({
        type: "plaintext",

        recipients: {
            list_id: listId,
        },

        settings: {
            subject_line: "Today's Positivity Content",
            title: "Your's Daily NewsLetter",
            from_name: "Sahil@Positivity",
            reply_to: "sahilflash123@gmail.com",
        }
    });

    var campaignId = response.id;

    console.log(campaignId);
    console.log(response.status);
    try{
        const response2 = await client.campaigns.setContent(
            campaignId,
            {
                plain_text: MESSAGE,
            }
        );
        //console.log(response2);
        }
        catch(error){
            console.log(error);
        }
    const response3 = await client.campaigns.send(campaignId);
        console.log("Done");
        console.log(response3);
};

//get's the daily quote from the Quotes API and calling the update_content function after completion
function get_message_and_update_campaign() {
    var need;
    https.get('https://quotes.rest/qod.json?category=inspire', (res) => {
        //console.log(res);

        res.on('data', (d) => {
            need = d;

            process.stdout.write(d);
            // message = d.contents.quotes[0].quote;
            // message+=" author: " + d.contents.quotes[0].author; 

            var data = JSON.parse(need);
            //console.log(data);
            //getting the quote and author name by getting to know the response through documentation
            var QUOTES = data.contents.quotes[0].quote;
            var AUTHOR = data.contents.quotes[0].author;
            console.log(QUOTES, AUTHOR);

            //constructing the main message with quote and author added
            MESSAGE = "Dear User\n\nStart today's day with the great saying by '"+AUTHOR+"'\nQuote: "+QUOTES+"\n\nRegards\nPositivity Team";
            console.log(MESSAGE);

            //calling the update_content function with given message
            update_content(MESSAGE);
        });

    }).on('error', (e) => {
        console.error(e);
    });
}

//Function that makes an instance of date and checks whether hours and minutes
//are equal to what specified above in app if equal call get_message and send the mail
//otherwise try after 1 minute 60000 milliseconds
function start_schedule() {
    var time = new Date();
    console.log(time.getHours());
    console.log(time.getMinutes());
    let timeout=60000;

    if (time.getHours(0) == hour && time.getMinutes() == minute) {
        get_message_and_update_campaign();
        //update_content("Hello 2");
    }
        setTimeout(start_schedule, timeout);
}

start_schedule();

//sending the index file when get request made
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
})

app.post("/", (req, res) => {

    console.log(req.body);

    //extract data out of req body
    var data = {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    }
    //hash the mail which is required by mailchimp api later
    const hash_email = md5(data.email.toLowerCase());
    console.log(hash_email);

    async function update_subscribe() {
        try{
        const response = await client.lists.setListMember(
            listId,
            hash_email,
            { email_address: data.email, status: "subscribed" }
        );
        res.sendFile(__dirname + "/successful.html");
    }
        catch(err){
          //  console.log(err);
        }
    };

    async function run() {
        try {
            const response = await client.lists.addListMember(listId, {
                email_address: data.email,
                status: "subscribed",
                merge_fields: {
                    FNAME: data.firstName,
                    LNAME: data.lastName
                }
            });

            res.sendFile(__dirname + "/successful.html");

        }
        catch (error) {
            res.send("<h1>Cannot Subscribe Contact Admin</h1>");
            console.log(error);
        }
    };

    //check if user wants to subscribe or unsubscribe 
    // 1 for subscribe 2 for unsubscribe

    if (req.body.button == "1") {
        //check if already a user if yes then check status 
        //status = subscriber if yes then return already exist html else update status
        //else add new user
        async function check_and_subcribe() {
            try {
                console.log("check and subscribe");   
                const response = await client.lists.getListMember(
                    listId,
                    hash_email,
                );
                console.log(response);
                if (response.status == "subscribed") {
                    res.sendFile(__dirname + "/already_exist.html")
                }
                else {
                    update_subscribe();
                }
            }
            catch (error) {
               // console.log(error); 
                if (error.status == 404) {
                    run();
                }
            }
        };
        check_and_subcribe();
    }
    else {
        async function unsubscribe() {
            try {
                console.log("unsubscribe");
                const response = await client.lists.updateListMember(
                    listId,
                    hash_email,
                    {
                        status: "unsubscribed"
                    }
                );
                res.sendFile(__dirname + "/unsubscribed.html");
            }
            catch (error) {
                if (error.statusCode == 404) {
                    res.send("not a subscriber");
                }
            }
        }

        unsubscribe();
    }
})





//giving the app where to listen for requests
//proess.env.port is when deploying online we don't know which port it might run
//so either that and if locally runnning then on port = 3000 above given
app.listen(process.env.PORT || port, () => {
    console.log("Successfully running on port " + port);
})





//api_key d131391dc7f8ea9302e61c987ea09603-us5

//List_id 7a72e8ae47

//http://quotes.rest/qod.json?category=inspire