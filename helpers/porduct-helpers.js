//const { log } = require("handlebars")
var db=require('../Config/connection')
var collection=require('../Config/collections')
var ObjectId=require('mongodb').ObjectId
const { response } = require('express')
const { contentDisposition } = require('express/lib/utils')
const { reject } = require('bcrypt/promises')
const async = require('hbs/lib/async')
const collections = require('../Config/collections')
module.exports={
  doLogin:(Admindata)=>{
    return new Promise(async(resolve,reject)=>{
      let response={ }
      let admin=await db.get().collection(collections.ADMINDATA).findOne({email:Admindata.email})
      if(admin){
        if(admin.password==Admindata.password){
           console.log('Admin login success');
           response.admin=admin
           response.status=true
           resolve(response)
       }else{
        console.log('error password')
        resolve({status:false})
   }
      }else{
           console.log('login failed')
           resolve({status:false})
      }
    })
  },
  addProduct:(product,callback)=>{
     // console.log(product)
       product.price=Number(product.price)
      db.get().collection('product').insertOne(product).then((data)=>{
        //console.log(data)
        callback(data.insertedId)
      })
  },
  getAllProducts:()=>{
    return new Promise(async(resolve,reject)=>{
      let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
      resolve(products)
    })
  },
  deleteproduct:(prodid)=>{
       return new Promise((resolve,reject)=>{
         console.log('delete---id--is---'+prodid)
         console.log(ObjectId(prodid))
        db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:ObjectId(prodid)}).then((response)=>{
         // console.log('_-_-_-_-_-_-_-_-_-_-_-_-_-_')
          console.log(response)
          resolve(response)

        })
       })   
  },
  getproductDetails:(prodid)=>{
    return new Promise((resolve,reject)=>{
      //console.log('delete--id--is---'+prodid)
      //console.log(ObjectId(prodid))
     db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(prodid)}).then((product)=>{
       resolve(product)

     })
    })   
  },

  updateproduct:(prodid,prodetals)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(prodid)},{
        $set:{
          name:prodetals.name,
          Category:prodetals.Category,
          price:Number(prodetals.price),
          Description:prodetals.Description
        }
      }).then((response)=>{
        resolve()
      })
    })
  }






  }