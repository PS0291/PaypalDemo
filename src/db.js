const sqlite3 = require('sqlite3').verbose();

async function getDb() {
    return new sqlite3.Database('paypal');
}

async function insert(data) {
    const db = await getDb()
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO transactions(paypal_transaction_id, payer_id, amount, currency, created_at, status, item_name) VALUES (?, ?, ?, ?, ?, ?, ?)", [
                data.purchase_units[0].payments.captures[0].id,
                data.payer.payer_id,
                data.purchase_units[0].payments.captures[0].amount.value,
                data.purchase_units[0].payments.captures[0].amount.currency_code,
                data.purchase_units[0].payments.captures[0].create_time,
                data.purchase_units[0].payments.captures[0].status,
                data.purchase_units[0].items[0].name
            ], function (err) {
                if (err) {
                    reject(err)
                }
                resolve(this.lastID)
            }
        );
    })
}

async function getData() {
    const db = await getDb()
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM transactions", [], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows)
        })
    })

}

module.exports = {
    insert,
    getData
}
