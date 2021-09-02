const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const client = require("@mailchimp/mailchimp_marketing");
const md5 = require("md5");
const { response } = require("express");
const https = require("https");
const { create } = require("domain");

var MESSAGE;
const hour = 7;
const minute = 0;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const port = 3000;
client.setConfig({
    apiKey: "d131391dc7f8ea9302e61c987ea09603-us5",
    server: "us5",
})
const listId = "7a72e8ae47";

const create_new_campaign = async () => {
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
    campaignId = response.id;
    console.log(campaignId);
};

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
            var QUOTES = data.contents.quotes[0].quote;
            var AUTHOR = data.contents.quotes[0].author;
            console.log(QUOTES, AUTHOR);

            MESSAGE = "Dear User\nStart today's day with the great saying by '"+AUTHOR+"'\nQuote: "+QUOTES+"\nRegards\nPositivity Team";
            console.log(MESSAGE);
            update_content(MESSAGE);
        });

    }).on('error', (e) => {
        console.error(e);
    });
}

//create_new_campaign();
//get_message_and_update_campaign();

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


app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
})

app.post("/", (req, res) => {

    console.log(req.body);

    var data = {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    }
    const hash_email = md5(data.email.toLowerCase());
    console.log(hash_email);

    async function update_subscribe() {
        try{
        const response = await client.lists.setListMember(
            listId,
            hash_email,
            { email_address: data.email, status: "subscribed" }
        );}
        catch(err){
            console.log(err);
        }
        res.sendFile(__dirname + "/successful.html");
    };

    async function run() {
        try {
            response = await client.lists.addListMember(listId, {
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

    if (req.body.button == "1") {
        async function check_and_subcribe() {
            try {
                const response = await client.lists.getListMember(
                    listId,
                    hash_email
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
                if (error == 404) {
                    run();
                }
            }
        };
        check_and_subcribe();
    }
    else {
        async function unsubscribe() {
            try {
                const response = await client.lists.updateListMember(
                    listId,
                    hash_email,
                    {
                        status: "unsubscribed"
                    }
                );
            }
            catch (error) {
                if (error.statusCode == 404) {
                    res.send("not a subscriber");
                }
            }
        }

        unsubscribe();
        res.sendFile(__dirname + "/unsubscribed.html");
    }
})






app.listen(process.env.PORT || port, () => {
    console.log("Successfully running on port " + port);
})





//api_key d131391dc7f8ea9302e61c987ea09603-us5

//List_id 7a72e8ae47

//http://quotes.rest/qod.json?category=inspire

// "quote": "You gotta commit. You've gotta go out there and improvise and you've gotta be completely unafraid to die. You've got to be able to take a chance to die. And you have to die lots. You have to die all the time.",
// "length": "208",
// "author": "Bill Murray",
// "tags": [