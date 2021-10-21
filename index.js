const express = require('express')
const {createOrder, captureOrder, getTransactions} = require("./src/paypal");
const {items} = require('./src/items')
const {insert, getData} = require("./src/db");
require('dotenv').config()

const app = express()
app.use(express.json());
app.use(express.urlencoded());
app.engine('html', require('ejs').renderFile);
const port = 3000

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('paypal');

db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS transactions (paypal_transaction_id VARCHAR, payer_id VARCHAR, amount VARCHAR, currency VARCHAR, created_at VARCHAR, status VARCHAR, item_name VARCHAR)");
});

db.close()

app.get('/', (req, res) => {
    res.render(
        __dirname + '/view/index.html',
        {items: items}
    )
})

app.get('/success', (req, res) => {
    res.sendFile(__dirname + '/view/success.html')
})

app.get('/error', (req, res) => {
    res.sendFile(__dirname + '/view/error.html')
})

app.get('/process', (req, res) => {
    res.sendFile(__dirname + '/view/wait.html')
})

app.post('/order', async (req, res) => {
    const id = req.body.id
    const selectedItem = items.filter((item) => {
        return item.id === parseInt(id)
    })
    try {
        const order = await createOrder(selectedItem[0])
        order.links.forEach((link) => {
            if (link.rel === 'approve') {
                res.redirect(link.href)
            }
        })
    } catch (e) {
        console.log(e)
        res.redirect('/error')
    }
})

app.post('/capture', async (req, res) => {
    const orderId = req.body.orderId
    try {
        const order = await captureOrder(orderId)
        await insert(order)
        res.json({success: true, message: 'success', order: order})
    } catch (e) {
        res.json({success: false, message: e.message})
    }
})

app.get('/transactions', async (req, res) => {
    const transactions = await getData()
    res.render(
        __dirname + '/view/transactions.html',
        {transactions: transactions}
    )
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
