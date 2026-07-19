const Joi = require('joi')  //data validation library used to validate incoming request data before it reaches your controller.

const signupValidation = (req, res, next) => {
    const schema = Joi.object(
        {
            name: Joi.string().min(3).max(100).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(3).max(100).required(),
        }
    )
    const { error } = schema.validate(req.body)
        if (error){
            console.log("Joi Validation Error:", error.details[0].message);
            return res.status(400).json({
                message: error.details[0].message
            });
        }
    next()
}


const loginValidation = (req, res, next) => {
    const schema = Joi.object(
        {
            email: Joi.string().email().required(),
            password: Joi.string().min(3).max(100).required(),
        }
    )
    const { error } = schema.validate(req.body)
    if (error){
        return res.status(400).json({
            message: "Bad Request", 
            error
        })
    }
    next()
}

module.exports = {
    signupValidation,
    loginValidation
}