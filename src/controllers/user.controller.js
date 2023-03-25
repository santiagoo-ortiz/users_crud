const catchError = require('../utils/catchError');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const EmailCode = require('../models/EmailCode');


const getAll = catchError(async(req, res) => {
    const results = await User.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {

    const {email, password, firstName, lastName, country, image, frontBaseUrl} = req.body

    const encryptedPassword = await bcrypt.hash(password, 10);

    const result = await User.create({email, password: encryptedPassword, firstName, lastName, country, image});

    const code = require('crypto').randomBytes(32).toString('hex')

    const link = `${frontBaseUrl}/verify_email/${code}`

    await sendEmail({
        to: email,
        subject: "Verify your email",
        html: `
        <h1> Hello! ${firstName} </h1>
        <p>Please, verify your email clicking on this link:</p> 
        <a href="${link}"> ${link} </a>`
    })

    await EmailCode.create({code, userId: result.id})

    return res.status(201).json(code);
});

const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await User.findByPk(id);
    if(!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    await User.destroy({ where: {id} });
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;

    const {firstName, lastName, country, image} = req.body

    const result = await User.update(
        {firstName, lastName, country, image},
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});


const verifyEmail = catchError(async(req,res) => {

    const { code } = req.params
    const result = await EmailCode.findOne({ where: {code} })
    if(!result) {return res.json({message: "Codigo invalido"})}
    await User.update({ isVerified: true }, {where: {id: result.userId }})
    await result.destroy()
    return res.json(result)

})

const login = catchError(async(req,res) =>{
    const {email, password} = req.body
    const user = await User.findOne( { where: {email} });
    if(!user) {return res.status(401).json({message: "Invalid email"})}
    if(!user.isVerified){return res.status(401).json({message: "The user is not verified yet"})}

    const userPassword = await bcrypt.compare(password, user.password)
    if(!userPassword) {return res.status(401).json({message: "Invalid password"})}

    const token = jwt.sign(
        {user},
        process.env.TOKEN_SECRET,
        {expiresIn: "1d"}
    )

    return res.json({user, token})
})

const me = catchError(async(req, res) => {
    const user = req.user
    return res.json(user)
})


module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update,
    verifyEmail,
    login,
    me
}