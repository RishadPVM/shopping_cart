var db=require('../Config/connection')
var collection=require('../Config/collections')
const bcrypt=require('bcrypt')
const { reject, promise } = require('bcrypt/promises')
const async = require('hbs/lib/async')
const { response } = require('express')
//const { Promise } = require('mongodb')

var ObjectId=require('mongodb').ObjectId

const Razorpay = require("razorpay")
var instance = new Razorpay({
    key_id: 'rzp_test_OewOI87tp2cx5y',
    key_secret: '8Ahj3D75MsEHiPyG2nO1Bx2B',
});

module.exports={
   
   doSignup:(userData)=>{
       console.log('usrr signup data is-----')
       console.log(userData)
       return new Promise(async(resolve,reject)=>{
        userData.password=await bcrypt.hash(userData.password,10) 
        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
            resolve(data.insertedId)

        })
        
       })      
   },

   doLogin:(userData)=>{
       return new Promise(async (resolve,reject)=>{
           let loginstatus=false
           let response={ }
           let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
           if(user){
               bcrypt.compare(userData.password,user.password).then((status)=>{
                   if(status){
                       console.log('login success');
                       response.user=user
                       response.status=true
                       resolve(response)
                   }else{
                       console.log('login failed')
                       resolve({status:false})
                   }
               })
           }else{
               console.log('login failed')
               resolve({status:false})
           }
       })
   },
   
   addToCart:(proid,userid)=>{
    proObj={
          item:ObjectId(proid),
          quantity:1
    }
       return new Promise(async(resolve,reject)=>{
           let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userid)})
           if(userCart){
            let proExit=userCart.product.findIndex(product=>product.item==proid)
           // console.log(proExit)
            if(proExit!=-1){
                db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userid),'product.item':ObjectId(proid)},
                {
                    $inc:{"product.$.quantity":1}
                }).then((response)=>{
                    resolve()
                })
            }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userid)},
                { 
                        $push:{product:proObj}      
                }
                ).then((response)=>{
                    resolve()
                })
            }
           }else{
               let cartObj={
                   user:ObjectId(userid),
                   product:[proObj]
               }
               db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                   resolve()
               })
           }
       })
   },
   
   getCartProducts:(userId)=>{
    console.log(userId)
       return new Promise(async(resolve,reject)=>{
           let cartItems =await db.get().collection(collection.CART_COLLECTION).aggregate([
               { 
                   $match:{user:ObjectId(userId)}
                  
               },
               {
                    $unwind:'$product'
               },
               {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity'
                    }
               },
               {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
               },
               {
                $project:{
                    item:1,
                    quantity:1,
                    product:{$arrayElemAt:['$product',0]}
                }
               }
              
            ]).toArray()
            console.log(cartItems)
           resolve(cartItems)
           
          
       })
   },
   getcartCount:(userID)=>{
    return new Promise(async(resolve,reject)=>{
       let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user : ObjectId(userID)})
       let count=0
       if(cart){
           count= await cart.product.length
       }
        resolve(count)
    })
   },
   changeCartQuantity:(data)=>{
    return new Promise((resolve,reject)=>{
        if(data.count==-1&&data.quantity==1){
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectId(data.cart)},
            {
                $pull:{product:{item:ObjectId(data.product)}}
            }).then((response)=>{
                resolve({removeProduct:true})
            })
        }else{
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectId(data.cart),'product.item':ObjectId(data.product)},
                {
                    $inc:{"product.$.quantity":Number(data.count)}
                }).then((response)=>{
                    resolve({status:true})
                })
            }
    })
   },

DeleteCartProduct:(data)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectId(data.cart)},
        {
            $pull:{product:{item:ObjectId(data.product)}}
        }).then((response)=>{
            resolve({removeProduct:true})
        })
    })
},

grtTolelAmont:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let totel =await db.get().collection(collection.CART_COLLECTION).aggregate([
            { 
                $match:{user:ObjectId(userId)}
               
            },
            {
                 $unwind:'$product'
            },
            {
                 $project:{
                     item:'$product.item',
                     quantity:'$product.quantity'
                 }
            },
            {
                 $lookup:{
                     from:collection.PRODUCT_COLLECTION,
                     localField:'item',
                     foreignField:'_id',
                     as:'product'
                 }
            },
            {
             $project:{
                 item:1,
                 quantity:1,
                 product:{$arrayElemAt:['$product',0]}
             }
            },
            {
                $group:{
                    _id:null,
                    totel:{$sum:{$multiply:['$quantity','$product.price']}}
                }
            }
           
         ]).toArray()
         console.log(totel)
        
        resolve(totel[0].totel)
        
        
       
    })
},
CartProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
        console.log(cart)
        resolve(cart.product)
    })
},

placeOrder:(order,products,price)=>{
    return new Promise((resolve,reject)=>{
       let status=order['payment-type']==='COD'?'placed':'penting'
       orderObj={
        DeliveryDetals:{
            moble:order.moble,
            address:order.Address,
            pincode:order.pincode
        },
        UserId:ObjectId(order.userId),
        PaymentMethod:order['payment-type'],
        Products:products,
        TotelPrice:price,
        Date:order.Dete,
        Status:status
       }
       db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
        db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectId(order.userId)})
        resolve(response.insertedId)
        
       })
    })
},

getUserOrder:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        console.log(userId)
        let order=await db.get().collection(collection.ORDER_COLLECTION).find({UserId:ObjectId(userId)}).toArray()
        console.log(order)
        resolve(order)
    })
},

getOrderProdct:(orderId)=>{
    console.log(orderId)
    return new Promise(async(resolve,reject)=>{
        let orderItems =await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            { 
                $match:{_id:ObjectId(orderId)}
               
            },
            {
                 $unwind:'$Products'
            },
            {
                 $project:{
                     item:'$Products.item',
                     quantity:'$Products.quantity'
                 }
            },
            {
                 $lookup:{
                     from:collection.PRODUCT_COLLECTION,
                     localField:'item',
                     foreignField:'_id',
                     as:'Products'
                 }
            },
            {
             $project:{
                 item:1,
                 quantity:1,
                 product:{$arrayElemAt:['$Products',0]}
             }
            }
           
         ]).toArray()
         console.log("orderItems =")
         console.log(orderItems)
        resolve(orderItems)
        
    })
},
generateRezorpay:(orderId,amond)=>{
    return new Promise(async(resolve,reject)=>{
        var order = await instance.orders.create({
            amount: Number(amond) * 100,
            currency: "INR",
            receipt: orderId,
        })
        resolve(order)
    })
}



} 