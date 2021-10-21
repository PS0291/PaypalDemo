const request = require('request');
const axios = require("axios");

const baseUri = process.env.STAGE === 'prod' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

async function getToken() {
    try {
        const params = new URLSearchParams()
        params.append('grant_type',  'client_credentials');
        const username = process.env.PAYPAL_CLIENT_ID
        const password = process.env.PAYPAL_CLIENT_SECRET

        const data = await axios.post(
            baseUri + "/v1/oauth2/token",
            params,
           {
               headers: {
                   "Accept": "application/json",
                   "Accept-Language": "en_US",
                   "content-type": "application/x-www-form-urlencoded"
               },
               auth: {
                   username: username,
                   password: password
               }
            }
        )
        return data.data.access_token
    } catch (e) {
        console.log(e)
    }
}

async function createOrder(item) {
    const token = await getToken()
    const order = await axios.post(
        baseUri+"/v2/checkout/orders",
        {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": item.currency,
                        "value": item.amount,
                        "breakdown": {
                            "item_total": {
                                "currency_code": item.currency,
                                "value": item.amount
                            }
                        }
                    },
                    'items': [
                        {
                            'name': item.name,
                            'unit_amount': {
                                "currency_code": item.currency,
                                "value": item.amount
                            },
                            'quantity': 1
                        }
                    ]
                }
            ],
            "application_context": {
                "return_url": "http://localhost:3000/process",
                "cancel_url": "http://localhost:3000/error"
            }
        },
        {
            headers: {
                "Authorization" : "Bearer "+ token
            }
        }
    )
    return order.data
}

async function captureOrder(orderId) {
    const token = await getToken()

    const order = await axios.post(
        baseUri+"/v2/checkout/orders/"+orderId+"/capture",
        {
        },
        {
            headers: {
                "Authorization" : "Bearer "+ token
            }
        }
    )
    const completedOrder = await axios.get(
        baseUri+"/v2/checkout/orders/"+orderId,
        {
            headers: {
                "Authorization" : "Bearer "+ token
            }
        }
    )
    return completedOrder.data
}

async function getTransactions() {
    const token = await getToken()
    let startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    startDate = startDate.toISOString()
    const endDate = new Date().toISOString()
    const order = await axios.get(
        baseUri+"/v1/reporting/transactions?start_date="+startDate+"&end_date="+endDate,
        {
            headers: {
                "Authorization" : "Bearer "+ token
            }
        }
    )

    return order.data
}

module.exports = {
    createOrder,
    captureOrder,
    getTransactions
}
