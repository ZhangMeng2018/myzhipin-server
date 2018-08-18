const express = require('express');
const md5 = require('blueimp-md5');

const {UserModel,ChatModel} = require('../db/users_db');

const router = express.Router();
const filter = {password:0,__v:0};

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
        res.send({code: 0, data: {_id: userDoc._id, username, type}})
      });
    }
  })
});
router.post('/login', function(req, res) {
  const {username,password} = req.body;
  UserModel.findOne({username,password:md5(password)},filter,(err,userDoc) =>{
    if(!userDoc){
      res.send({code:1,msg:'用户名或密码错误'})
    }else{
        res.cookie('userid', userDoc._id, {maxAge: 1000*60*60*24*7});
        res.send({code: 0, data: userDoc})
    }
  })
});

router.post('/updateUser', function(req, res) {
  const userid = req.cookies.userid;
  if(!userid){
   return res.send({code:1,msg:'请先登录'})
  }
  UserModel.findByIdAndUpdate({_id:userid},req.body,(err,userDoc) =>{
    if(!err){
      const {username,type,_id} = userDoc;
      res.send({code: 0, data: {username,type,_id,...req.body}})
    }else{
      res.send({code:1,msg:'请先登录'})
    }
  })
});

router.get('/user', function(req, res) {
  const userid = req.cookies.userid;
  UserModel.findOne({_id:userid},filter,(err,userDoc) =>{
    if(!userDoc){
      res.clearCookie('userid');
      res.send({code:1,msg:'请先登录'})
    }else{
      res.send({code: 0, data: userDoc})
    }
  })
});
router.get('/userList', function(req, res) {
  const type = req.query.type;
  UserModel.find({type},filter,(err,userList) =>{
    if(!userList.length){
      res.send({code:1,msg:'暂无用户在线'})
    }else{
      res.send({code: 0, data: userList})
    }
  })
});

router.get('/msglist', function(req, res) {
  const userid = req.cookies.userid;
  ChatModel.find({'$or':[{from:userid},{to:userid}]},filter,(err,chatMsgs) =>{
    if(!chatMsgs){
      res.send({code:1,msg:''})
    }else{
      res.send({code: 0, data: chatMsgs})
    }
  })
});

router.post('/readmsg',function (req,res) {
  const to = req.cookies.userid;
  const from = req.body.from;
  console.log(req.body,'更新数据库');
  ChatModel.update({to,from,unRead:1},{$set:{unRead: 0}},{multi: true},(err,doc)=>{
    res.send({code: 0, data: doc.nModified})
  })
});


module.exports = router;
