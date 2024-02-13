var uid = null;

AFRAME.registerComponent("marker-handler",{
    init:async function(){

        //get toys collection from firebase
        var toys = await this.getToys();

        if(uid === null)
        {
            this.askUserId();
        }

        this.el.addEventListener("markerFound",(e) => {
            if(uid !== null){
            var markerId = this.el.id;
            this.handleMarkerFound(toys,markerId)
            }
        })
        this.el.addEventListener("markerLost",(e) => {
            this.handleMarkerLost()
        })
    } ,
    askUserId: function(){
        var iconURL = "https://raw.githubusercontent.com/whitehatjr/ar-toy-store-assets/master/toy-shop.png"

        swal({
            title: "Welcome to Toy Store",
            icon: iconURL,
            content: {
                element: "input",
                attributes: {
                    placeholder: "Type your UID:( U01 )",
                    input: "string",
                }
            }
        }).then(inputValue => {
            uid = inputValue;
        })
    },
    handleMarkerFound:function(toys, markerId){
        var toy = toys.filter(toy => toy.id === markerId)[0]

        if(toy.out_of_stock){
            swal({
                icon: "warning",
                title: toy.toy_name.toUpperCase(),
                text: "This toy is currently out of stock!!!",
                timer: 2500,
                buttons: false
            })
        } else 
        {

            var model = document.querySelector(`#model-${toy.id}`)
            model.setAttribute("position", toy.model_geometry.position)
            model.setAttribute("rotation", toy.model_geometry.rotation) 
            model.setAttribute("scale", toy.model_geometry.scale)
            
            var model = document.querySelector(`#model-${toy.id}`)
            model.setAttribute("visible", true)

            var mainPlane = document.querySelector(`#main-plane-${toy.id}`)
            mainPlane.setAttribute("visible",true)

            var buttondiv = document.getElementById("button-div")
            buttondiv.style.display = "flex";

            var ratingbutton = document.getElementById("ratingbutton")
            var orderbutton = document.getElementById("orderbutton")
            var summaryButton = document.getElementById("order-summary-button")

            ratingbutton.addEventListener("click",() => {
                uid = uid.toUpperCase();
                this.handleOrder(uid, toy);
                swal({
                    icon: "warning",
                    title: "Rate Toy",
                    text: "Work in progress..."
                })
            })
            orderbutton.addEventListener("click",() => {
                swal({
                    icon: "https://i.imgur.com/4NZ6uLY.jpg",
                    title: "Thanks For Order !",
                    text: "",
                    timer: 2000,
                    buttons: false
                })
            }) 
            summaryButton.addEventListener("click",() => {
                this.handleOrderSummary();
            })    
        }                   
    },
    handleOrderSummary:async function(){
        var uid;
        var orderSummary = await this.getOrderSummary(uid);
    
        var modalDiv = document.getElementById("modal-div")
        modalDiv.style.display = "flex";
    
        var tableBodyTag = document.getElementById("bill-table-body");
        tableBodyTag.innerHTML = ""
    
        var currentOrder = Object.keys(orderSummary.current_orders);
        currentOrder.map(i => {
          var tr = document.createElement("tr");
          var item = document.createElement("td");
          var price = document.createElement("td");
          var quantity = document.createElement("td");
          var subTotal = document.createElement("td");
    
          item.innerHTML = orderSummary.current_orders[i].item
          price.innerHTML = "$" + orderSummary.current_orders[i].price
          price.setAttribute("class", "text-center")
          quantity.innerHTML = orderSummary.current_orders[i].quantity
          quantity.setAttribute("class", "text-center")
          subTotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal
          subTotal.setAttribute("class", "text-center")
    
          tr.appendChild(item);
          tr.appendChild(price);
          tr.appendChild(quantity);
          tr.appendChild(subTotal);
    
          tableBodyTag.appendChild(tr);
    
        });
    
        var totaltr = document.createElement("tr") 
        var td1 = document.createElement("td")
        td1.setAttribute("class", "no-line") 
    
        var td2 = document.createElement("td")
        td2.setAttribute("class", "no-line") 
    
        var td3 = document.createElement("td")
        td3.setAttribute("class", "no-line text-center") 
        
        var strongTag = document.createElement("strong")
        strongTag.innerHTML = "Total"
    
        td3.appendChild(strongTag);
    
        var td4 = document.createElement("td")
        td4.setAttribute("class", "no-line text-right") 
        td4.innerHTML = "$" + orderSummary.total_bill
    
        totaltr.appendChild(td1);
        totaltr.appendChild(td2);
        totaltr.appendChild(td3);
        totaltr.appendChild(td4);
    
        tableBodyTag.appendChild(totaltr);
    
      },
      getOrderSummary:async function(tNumber){
        return await firebase
        .firestore()
        .collection("tables")
        .doc(tNumber)
        .get()
        .then(doc => doc.data())
      },
    handleOrder: function(uid, toy){
        firebase
        .firestore()
        .collection("users")
        .doc(uid)
        .get()
        .then( doc => {
            var details = doc.data();

            if(details["current_orders"][toy.id]){
                details["current_orders"][toy.id]["quantity"] += 1;

                var currentQuantity = details["current_orders"][toy.id]["quantity"]

                details["current_orders"][toy.id]["subtotal"] = 
                currentQuantity * toy.price;
            } else {
                details["current_orders"][toy.id] = {
                    item: toy.toy_name,
                    price: toy.price,
                    quantity: 1,
                    subtotal: toy.price * 1
                };
            }

            details.total_bill += toy.price;

            //db update
            firebase
            .firestore()
            .collection("users")
            .doc(doc.id)
            .update(details)
        })
    },
    handleMarkerLost:function(){
        var buttondiv = document.getElementById("button-div")
        buttondiv.style.display = "none";
    },
    getToys: async function(){
        return await firebase
        .firestore()
        .collection("toys")
        .get()
        .then(snap => {
            return snap.docs.map(doc => doc.data());
        })
    },
})
