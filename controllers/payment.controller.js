const { createOrder } = require("../services/payment.service.js")
const paymentService = require("../services/payment.service");



 const PayController = async(req,res)=>{
    const {amount,info} = req.body;

    try{
        const data = await createOrder(amount,info);
        return res.status(200).json({success:true,data});
    }catch(err){
        return res.status(400).json({success:false,message:err.message});
    }
}

const verifyPaymentController = async (req, res) => {
    const { paymentId, orderId, signature } = req.body;

    if (!paymentId) {
        return res.status(400).json({
            success: false,
            message: "paymentId is required"
        });
    }

    try {
        const verificationResult = await paymentService.verifyPaymentFlexible(
            paymentId,
            orderId,
            signature
        );

        if (verificationResult.valid) {
            return res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                method: verificationResult.method,
                payment: verificationResult.payment
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed",
                reason: verificationResult.reason,
                payment: verificationResult.payment
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Payment verification error"
        });
    }
};

module.exports = {PayController, verifyPaymentController}