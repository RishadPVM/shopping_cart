const { response } = require('express');
var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
const porductHelpers = require('../helpers/porduct-helpers');
const userHelpers=require('../helpers/user-helpers')
/* verifylogin */
const verifylogin=(req,res,next)=>{
  if(req.session.user.loggedIn){
   next()
  }else{
    res.redirect('/login')
  }
}
function currentdate(){
  let ts = Date.now();

let date_ob = new Date(ts);
let date = date_ob.getDate();
let month = date_ob.getMonth() + 1;
let year = date_ob.getFullYear();

return date =date + "-" + month + "-" + year


}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user= req.session.user
  let cartCount=null
  if(user){
    cartCount=await userHelpers.getcartCount(user._id)
  } 
  porductHelpers.getAllProducts().then((products)=>{
    // console.log(products)
     res.render('user/view-products',{products,user,cartCount});
   })
   

});
  router.get('/login',(req,res)=>{
    if(req.session.user){
      res.redirect('/')
    }else{

      res.render('user/login',{'loginError':req.session.userLoginError})
      req.session.userLoginError=false
    }
    
  })

  router.get('/signup',(req,res)=>{
    res.render('user/signup')
  })
  
  router.post("/signup",(req,res)=>{
   // console.log(req.body)
    userHelpers.doSignup(req.body).then((response)=>{
      //console.log(response)
      req.session.user=response;
      req.session.user.loggedIn=true;
      res.redirect('/')
    })
  })

  router.post('/login',(req,res)=>{
   // console.log('login data is')
   console.log(req.body)
   userHelpers.doLogin(req.body).then((response)=>{
     if(response.status){
       req.session.user=response.user
       req.session.user.loggedIn=true
       res.redirect("/")
     }else{
       req.session.userLoginError="Invalid userName or password"
       res.redirect('/login')
     }
   })
  })
  router.get('/logout',(req,res)=>{
    req.session.user=null
    req.session.user.loggedIn=false
    res.redirect('/')
  })
  router.get('/cart',verifylogin,async(req,res)=>{
    let user=req.session.user
     let products=await userHelpers.getCartProducts(user._id)
     let TotrlAmont=await userHelpers.grtTolelAmont(user._id)
      //console.log(products);
    res.render('user/cart',{products,user,TotrlAmont})
  })
  
  router.get('/add-to-cart/:id',(req,res)=>{
    userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
      res.json({status:true})
    })
  })

  router.post('/Change_cart_quantity',(req,res)=>{
    console.log(req.body)
    userHelpers.changeCartQuantity(req.body).then(async(response)=>{
      response.TotrlAmont=await userHelpers.grtTolelAmont(req.body.user)
      res.json(response)
    })
  })

  router.post('/Delete_cart_product',(req,res)=>{
    //console.log(req.body)
    userHelpers.DeleteCartProduct(req.body).then((response)=>{
      res.json(response)
    })
  })

  router.get('/plceOrder',verifylogin,async(req,res)=>{
    let user=req.session.user
    let TotrlAmont=await userHelpers.grtTolelAmont(user._id)
    res.render('user/address',{user,TotrlAmont,currentdate})
  })

  router.post('/place-Order',async(req,res)=>{
    console.log(req.body)
    let products=await userHelpers.CartProducts(req.body.userId)
    let totelAmond=await userHelpers.grtTolelAmont(req.body.userId)
    userHelpers.placeOrder(req.body,products,totelAmond).then((orderId)=>{
      if(req.body['payment-type']==='COD'){
        res.json({COd:true})
      }else{
        userHelpers.generateRezorpay(orderId,totelAmond).then((response)=>{
          res.json(response)
        })
      }
        
    })
    
  })

  router.get('/playsing-succuss',verifylogin,async(req,res)=>{
    let user=req.session.user
    res.render('user/playsing-succuss',{user})
  })

  router.get('/orders',verifylogin,async(req,res)=>{
    let user=req.session.user
    let userOrder=await userHelpers.getUserOrder(user._id)
    res.render('user/order',{user,userOrder})
  })
  router.get('/OrderProdcuts/:id',verifylogin,async(req,res)=>{
    console.log(req.params.id)
     let user=req.session.user
    let products=await userHelpers.getOrderProdct(req.params.id)
    res.render('user/OrderProdcuts',{user,products})
  })
  router.post('/Verifypayment',(req,res)=>{
    console.log(req.body)
  })


module.exports = router;
