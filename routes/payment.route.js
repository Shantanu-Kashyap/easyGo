const {PayController, verifyPaymentController} = require("../controllers/payment.controller.js")
const express =  require("express")
const router = express.Router()

router.post("/order",PayController)
router.post("/verify",verifyPaymentController)

module.exports = router