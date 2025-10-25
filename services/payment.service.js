const Razorpay = require("razorpay");
const crypto = require("crypto");


if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay credentials not configured properly");
}


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


/**
 * Create a new Razorpay Order
 * @param {number} amount - Amount in rupees
 * @param {object} info - Optional notes object
 */
const createOrder = async (amount, info = {}) => {
  const options = {
    amount: amount * 100,        
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
    notes: info,                
  };

  try {
    const response = await razorpay.orders.create(options);
    return response;
  } catch (error) {
    throw new Error("Unable to create Razorpay order");
  }
};

/**
 * Fetch a payment from Razorpay
 * @param {string} paymentId
 */
const fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (err) {
    throw new Error("Unable to fetch payment from Razorpay");
  }
};

/**
 * Verify Razorpay Payment Signature
 * @param {string} paymentId - Razorpay Payment ID
 * @param {string} orderId - Razorpay Order ID
 * @param {string} signature - Razorpay Signature
 * @returns {boolean} - Whether the signature is valid
 */
const verifyPayment = (paymentId, orderId, signature) => {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
};

/**
 * Flexible verification:
 * - If signature provided: validate using HMAC(orderId|paymentId)
 * - If no signature: fetch payment and accept if status is 'captured' or 'authorized' and order_id matches (if orderId given)
 */
const verifyPaymentFlexible = async (paymentId, orderId = null, signature = null) => {
  if (!paymentId) throw new Error("paymentId is required for verification");

 
  if (signature && orderId) {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return {
      valid: generatedSignature === signature,
      method: "signature",
    };
  }

 
  const payment = await fetchPayment(paymentId);

  if (orderId && payment.order_id && payment.order_id !== orderId) {
    return { valid: false, method: "fetch", reason: "order_id_mismatch", payment };
  }

  const okStatuses = ["captured", "authorized"];
  const valid = okStatuses.includes(payment.status);

  return { valid, method: "fetch", payment };
};

module.exports = {
  createOrder,
  verifyPayment,           
  fetchPayment,
  verifyPaymentFlexible,
};
