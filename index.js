const rp = require('request-promise');
const Splitwise = require('splitwise');

const accountSid = 'TWILIO_SID';
const authToken = 'TWILIO_TOKEN';

const client = require('twilio')(accountSid, authToken);

const contacts = {
    Manas: '1234567890',
    /** Your contact list should go here. */
}

/**
 * Method get petrol prices in Hyderabad.
 */
async function getPrice() {

    try {
        const mashapeKey = 'MASHAPE_KEY';
        const city = 'Hyderabad';
        // Petrol price API
        const options = {
            uri: 'https://newsrain-petrol-diesel-prices-india-v1.p.mashape.com/capitals',
            headers: {
                'X-Mashape-Key': mashapeKey,
                'Accept': 'application/json'
            }
        };
        const result = await rp(options);
        const cities = JSON.parse(result).cities;
        let price = 0;
        for (let i = 0; i < cities.length; i++) {
            if (cities[i].city === city) {
                price = cities[i].petrol;
            }
        }
        const body = `*Petrol:*\nPetrol price today in *${city}* is *${price} RS.*.\n`;
        return body;
    } catch (e) {
        console.log(e.message);
    }
}

/**
 * Method to fetch weather report of Hyderabad.
 */
async function getWeatherDetails() {
    try {
        const openwatherAPIKey = 'OPENWEATHER_API_KEY';
        const city = 'Hyderabad'
        const res = await rp(`http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${openwatherAPIKey}`);
        const results = JSON.parse(res);
        let body = `\n*Weather:*\nCurrent temperature in ${city} is *${results.main.temp}*°C and will record a maximum of *${results.main.temp_max}*°C\nOther highlights:\n`;
        for (let i = 0; i < results.weather.length; i++) {
            body = body + `=> *${results.weather[i].main}*: ${results.weather[i].description}\n`;
        }
        return body + '\n\n';
    } catch (e) {
        return `Error when trying to get weather report, ${e.message}\n`;
    }
}

/**
 * Method to forward message using twillio sandbox number.
 * @param {string} number Contact number where message needs to be forwarded.
 * @param {string} messageBody Message body that needs to be forwarded.
 */
const sendMessage = async function (number, messageBody) {
    return new Promise(async (res, rej) => {
        try {
            client.messages
                .create({
                    body: messageBody,
                    from: `whatsapp:+${OUT_BOUND_NUMBER}`,
                    to: `whatsapp:+91${number}`
                })
                .then((message) => {
                    console.log(`Message has been forwarded with SID: ${message.sid}`);
                    res();
                })
                .done();
        } catch (e) {
            rej(e);
        }
    });
}

const splitwiseDetails = async function () {
    const sw = Splitwise({
        consumerKey: 'SPLITWISE_CONSUMER_KEY',
        consumerSecret: 'SPLITWISE_CONSUMER_SECRET'
    });

    const groupDetails = await sw.getGroup({ id: 10358030 });
    const users = getUserNameIDCombination(groupDetails.members);
    const simplifiedDebts = groupDetails.simplified_debts;
    let splitwiseText = '\n\n*Splitwise:*\nSplitwise summary of *Thugs*(simplified):\n';
    for (const simplifiedDebt of simplifiedDebts) {
        splitwiseText += `*${users[simplifiedDebt.from]}*` + ' owes ' + `*${users[simplifiedDebt.to]}*` + ` =>  *${simplifiedDebt.amount} RS*\n`;
    }
    splitwiseText += '\n_(Please try to settle off stuff faster.)_';
    return splitwiseText;
}

const getUserNameIDCombination = function (members) {
    const combo = {};
    for (const member of members) {
        combo[member.id] = member.first_name;
    }
    return combo;
}

exports.rootFunction = async function () {
// const rootFunction = async function () {
    const prices = await getPrice();
    const weather = await getWeatherDetails();
    const splitwise = await splitwiseDetails();

    // Send message to all in forward list.
    for (const contact in contacts) {
        const greeting = `*Very Good Morning ${contact}!!*\n\n`;
        await sendMessage(contacts[contact], greeting + weather + prices + splitwise);
        console.log(`Message sent to ${contact}`);
    }
    console.log('Message forwarding over.');
}

// rootFunction();