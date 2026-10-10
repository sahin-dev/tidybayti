const ApiError = require("../../../error/ApiError")
const { SubscriptionPlan } = require("../subscription/subscription.model")
const User = require("../user/User")
const stripeService = require("./stripe.service")
const httpStatus = require("http-status");


const generatePaymentLink = async (userId, price_id) => {

    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(httpStatus.NOT_FOUND, "user not found")
    }

    const plan = await SubscriptionPlan.findOne({
        stripe_price_id: price_id,
        isActive: true,
    })
    if (!plan) {
        throw new ApiError(httpStatus.NOT_FOUND, "subscription plan not found")
    }

    let customer_id = user.stripe_customer_id

    if(!customer_id){
        const customer = await stripeService.createCustomer(
            `${user.firstName} ${user.lastName}`, user.email, user.phoneNumber, user.address)

            await User.findByIdAndUpdate(user._id, {
                stripe_customer_id:customer.id
            })

            customer_id = customer.id
        
    }

    const stripe_session = await stripeService.createSession(price_id, customer_id)

    return stripe_session

}

const getUserSubscriptionInfo = async (userId)=> {
    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(httpStatus.NOT_FOUND, "user not found")
    }

    if(!user.stripe_customer_id){
        throw new ApiError(httpStatus.BAD_REQUEST, "user is not authorized with stripe")
    }

    const userSubscriptionInfo = await stripeService.getUserSubscriptionInfo(user.stripe_customer_id)

    return userSubscriptionInfo
}


const paymentService = {
    generatePaymentLink,
    getUserSubscriptionInfo
}

module.exports = paymentService
