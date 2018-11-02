let express = require('express')
let app = express()
let bodyParser = require('body-parser')
app.use(bodyParser.raw({ type: '*/*' }))
let fs = require('fs')

let passwords = {}
let sessions = {}
let chatMessages = [
    {
        username: 'bob',
        message: 'hello'
    },
    {
        username: 'sue',
        message: 'hey there'
    }
]
let generatedSessionID = function () {
    return Math.floor(Math.random() * 10000000000)
}

try {
    let passwordsContent = fs.readFileSync("passwords.txt")
    passwords = JSON.parse(passwordsContent)
    let sessionsContent = fs.readFileSync("sessions.txt")
    sessions = JSON.parse(sessionsContent)
    let messagesContent = fs.readFileSync("messages.txt")
    chatMessages = JSON.parse(messagesContent)
} catch (err) {}

let activeUsers= {}

app.post('/signup', function (req, res){
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password
    if (passwords[username]) {
        res.send('signupFail')
        return
    }
    passwords[username] = password
    fs.writeFileSync('./passwords.txt', JSON.stringify(passwords))
    let sessionID = generatedSessionID()
    sessions[sessionID] = username
    fs.writeFileSync('./sessions.txt', JSON.stringify(sessions))
    let newMessage = {
        username: 'Notice',
        message: username + ' has just joined the chatroom'
    }
    chatMessages = chatMessages.concat(newMessage)

    res.set('Set-Cookie', sessionID)
    res.send(JSON.stringify({success: true}))
})

app.post('/login', function (req, res){
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password
    if (passwords[username] == password) {
        let sessionID = generatedSessionID()
        sessions[sessionID] = username
        let newMessage = {
            username: 'Notice',
            message: username + ' has just joined the chatroom'
        }
        chatMessages = chatMessages.concat(newMessage)
        res.set('Set-Cookie', sessionID)
        res.send(JSON.stringify({success: true}))
    } else {
        res.send('loginFail')
    } 
})

app.get('/activeUsers', function (req, res) {
    let users = Object.keys(activeUsers)
    users.forEach(function(user) {
        if(activeUsers[user] < Date.now() - 300000){
            delete activeUsers[user]
        }
    })
    users = Object.keys(activeUsers)
    res.send(JSON.stringify(users))
})

app.post('/addMessage', function (req, res) {
    let parsed = JSON.parse(req.body)
    let sessionID = req.headers.cookie
    let message = parsed.msg
    let username = sessions[sessionID]
    if (username === undefined) {
        res.send(JSON.stringify({error: true}))
        return
    }
    let newMessage = {
        username: username,
        message: message
    }
    if (chatMessages.length === 10) {
        chatMessages.shift()
    }
    chatMessages = chatMessages.concat(newMessage)
    fs.writeFileSync('./messages.txt', JSON.stringify(chatMessages))
    activeUsers[username] = Date.now()
    res.send(JSON.stringify({success: true}))
})

app.post('/getAllMessage', function (req, res){
    if (req.headers.cookie && sessions[req.headers.cookie] !== undefined) {
    res.send(JSON.stringify({msgs: chatMessages, success: true}))
    }else {
        res.send(JSON.stringify({success: false}))
    }
    
})

app.listen(4000, function() { console.log("Server started on port 4000") })
