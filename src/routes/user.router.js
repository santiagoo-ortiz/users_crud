const { getAll, create, getOne, remove, update, verifyEmail, login, me } = require('../controllers/user.controller');
const express = require('express');
const verifyJWT = require('../utils/verifyJWT');

const userRouter = express.Router();

userRouter.route('/')
    .get(verifyJWT, getAll)
    .post(create);

userRouter.route('/login')
    .post(login)

userRouter.route('/me')
    .get(verifyJWT, me)

userRouter.route('/verify/:code')
    .get(verifyEmail)

userRouter.route('/:id')
    .get(verifyJWT, getOne)
    .delete(verifyJWT, remove)
    .put(verifyJWT, update);

module.exports = userRouter;