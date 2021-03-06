const express = require('express');
const md5 = require('blueimp-md5');

const {UserModel} = require('../db/users_db');

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/register', function(req, res) {
  const {username,password,type} = req.body;
  UserModel.findOne({username},(err,userDoc) =>{
    if(userDoc){
      res.send({code:1,msg:'该用户已存在，请重新输入'})
    }else{
      new UserModel({username,password:md5(password),type}).save((err,userDoc) =>{
        res.cookie('userid', userDoc._id, {maxAge: 1000*60*60*24*7});
        res.send({code: 0, data: userDoc})
      });
    }
  })
});
router.post('/login', function(req, res) {
  const {username,password} = req.body;
  UserModel.findOne({username,password:md5(password)},{password:0},(err,userDoc) =>{
    if(!userDoc){
      res.send({code:1,msg:'用户名或密码错误'})
    }else{
        res.cookie('userid', userDoc._id, {maxAge: 1000*60*60*24*7});
        res.send({code: 0, data: userDoc})
    }
  })
});

module.exports = router;
