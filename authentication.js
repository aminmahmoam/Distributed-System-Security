const axios = require("axios")
const mqttMethod = require("./MQTT")
const mqtt = require("mqtt")
const client = mqtt.connect("mqtt://localhost:1883/")
const process = require('./nodemon.json')
const Api = axios.create({
    baseURL: process.env.VUE_APP_API_ENDPOINT || 'http://localhost:8000/api'
})
const jwt= require("jsonwebtoken")

// All the requests from client except for post a user and login a user that should be handled in the backend, 
// are sent to this component first.
// the message data sent by the client, is checked with the authenticatUser method and if the token is valid, 
// the user is authenticated and the request is then published and backend then can subscribe to give response.
// All the errors are handled to prvent this from crashing.
let result
let token
client.on("connect", e => {
    console.log("connected")
    client.subscribe("/dentistimo/unauthenticated/#", {qos:1},e => {
        client.on("message", (topic, m, option) => {
            console.log('aaoo got something')
            if (m.length !== 0){
                try {
                    let message = JSON.parse(m.toString())
                    console.log(message)
                    if (message.request && message.authenticated !== true) {
                        authenticateUser(message.data).then(data => {
                            if (data.authenticated === true) {
                                console.log('publishing')
                                message.authenticated = true
                                client.publish(topic, JSON.stringify(message), {qos:1})
                            } else if (data.authenticated === false) {
                                let res = { "id": message.id, "response": "response", "data": "401 unauthorized" }
                                client.publish(topic, JSON.stringify(res), {qos:1})
                                client.unsubscribe(topic)
                            }
                        })
                    }
                } 
                catch (e) {
                    let response = { "id": topic.split('/').pop(), "response": "response", "data": "400 Bad Requests" }
                    return client.publish(topic, JSON.stringify(response), {qos:1})
                }
            } 
        })
    })
})
// We are not using this method here!
async function postRequest(url, data, Autho) {
    let res = {}
    if(Autho != undefined){
        await Api.post(url, data, {headers: {Authorization: 'Bearer ' + Autho}}).then(response => {
            res = { "status": response.status + " " + response.statusText, "data": response.data }
        }).catch(e => {
            res = { "error": e.response.status + " " + e.response.statusText }
        })
        return res
    } else {
        await Api.post(url, data).then(response => {
            res = { "status": response.status + " " + response.statusText, "data": response.data }
        }).catch(e => {
            res = { "error": e.response.status + " " + e.response.statusText }
        })
        return res
    }
}
// Here we check if the token that has been sent with the user's request is valid or not.
// The validity of token is checked with the verify method of JsonWebToken library.
// If the token is valid, the user is authenticated otherwise it is onauthenticated.
 async function authenticateUser(req) {
    console.log(req.token)
    let data = {
        authenticated: false,
        userdata: req.token
    }

    if (req.token === null) {
        return data;
    }
    
    try {
        const decoded = jwt.verify(req.token, process.env.JWT_KEY);
        if (decoded) {
            data.authenticated = true;
            data.userdata = decoded;
            return data;
        } else {
            return data;
        }
    } catch (err) {
        return data;
    }

};

module.exports = {authenticateUser:authenticateUser}