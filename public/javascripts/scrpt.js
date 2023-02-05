
    function AddTocart(product){
        $.ajax({
         url:'add-to-cart/'+product,
         method:'get',
         success(response){
           if(response.status){
            let count=$('#cart-count').html()
            count=Number(count)+1
            $('#cart-count').html(count)
           }
         }
        })
     }