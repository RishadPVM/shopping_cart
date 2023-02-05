const { response } = require('express');
var express = require('express');
const res = require('express/lib/response');
const porductHelpers = require('../helpers/porduct-helpers');
var router = express.Router();
var productHelper=require('../helpers/porduct-helpers')


const verifyLogin=(req,res,next)=>{
  if(req.session.admin.Logging){
   next()
  }else{
    res.redirect('/admin')
  }
}


/* GET users listing. */
router.get('/', function(req, res,next) {
  console.log(req.session.admin)
  if(req.session.admin){
    porductHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products});
  })
  
  }else{

    res.render('admin/login',{'loginError':req.session.adminLoginError})
    req.session.adminLoginError=false
  }
  
});
   router.post('/adminLogin',function(req,res){
     productHelper.doLogin(req.body).then((response)=>{
      if(response.status){
        req.session.admin=response.admin
        req.session.admin.Logging=true
        res.redirect("/admin")
      }else{
        req.session.adminLoginError="Invalid userName or password"
        res.redirect('/admin')
      }
     })
   })

   router.get('/logout',(req,res)=>{
    console.log("admin logout")
    req.session.admin=null
    req.session.admin.loggedIn=false
    res.redirect('/admin')
  })

router.get('/add-product',verifyLogin,function(req,res){
  res.render('admin/add-product',{admin:true})
})
router.post("/add-product",function(req,res){  
 
  porductHelpers.addProduct(req.body,(id)=>{
    let image=req.files.image
    //console.log(id)
    image.mv('./public/product-image/'+id+'.jpg',(err)=>{
      if(!err){
        res.render("admin/add-product",{admin:true})
      }else{
        console.log('error is '+err)
      }
    })
    
  })

})
    router.get('/delete-product/:Id',verifyLogin,(req,res)=>{
     let prodid=req.params.Id
    // console.log('product id is -------')
   // console.log(prodid)
    porductHelpers.deleteproduct(prodid).then((response)=>{
    res.redirect('/admin/')

     })
}) 
    
   router.get('/edit-product/:id',verifyLogin,async (req,res)=>{
    let product=await porductHelpers.getproductDetails(req.params.id)
    //console.log(product)
     res.render('admin/edit-product',{admin:true,product})
   })

   router.post('/update-product/:id',(req,res)=>{
  
     let id=req.params.id
     porductHelpers.updateproduct(req.params.id,req.body).then(()=>{
     res.redirect('/admin')
     if(req.files.image){
       let image=req.files.image
      image.mv('./public/product-image/'+id+'.jpg')
     }
     })
      
   })

module.exports = router;

