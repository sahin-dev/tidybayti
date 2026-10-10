const { default: Stripe } = require("stripe");
const { stripe } = require("../../../config");
const ApiError = require("../../../error/ApiError");
const httpStatus = require("http-status")



const stripeClient = new Stripe(stripe.stripe_secret_key)

const createCustomer = async (name, email, phone, address)=> {
    const customer = await stripeClient.customers.create({
        email,
        name,
        phone,
        address
    })

    return customer
}


const createSession = async (price_id,customer_id)=> {

    if(!price_id || !customer_id){
        throw new ApiError(httpStatus.BAD_REQUEST, "price_id or customer_id are required")
    }
    if (!stripe.success_url) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Stripe success URL is not configured")
    }

    const session = await stripeClient.checkout.sessions.create({
        mode:"subscription",
        customer:customer_id,
        line_items:[
            {
                price:price_id,
                quantity:1
            }
        ],
        success_url:stripe.success_url,
        ...(stripe.cancel_url && { cancel_url: stripe.cancel_url }),
    })

    return session

}

const getUserSubscriptionInfo = async (customerId)=> {
    const subscription = await stripeClient.subscriptions.list({
        customer:customerId,
        status:"active"
    })

    return subscription
}


const stripeService = {
    createSession,
    createCustomer,
    getUserSubscriptionInfo
}

module.exports = stripeService
