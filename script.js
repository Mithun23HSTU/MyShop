// Load initial data
if(!localStorage.getItem("users")){
    fetch("data.json")
    .then(res=>res.json())
    .then(data=>{
        localStorage.setItem("users", JSON.stringify(data.users));
        localStorage.setItem("products", JSON.stringify(data.products));
        localStorage.setItem("cart", JSON.stringify(data.cart));
        localStorage.setItem("orders", JSON.stringify(data.orders));
        localStorage.setItem("sales", JSON.stringify(data.sales));
    });
}

// ------------------- User Section -------------------
function updateHeader(){
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    let userSection = document.getElementById("userSection");
    if(!userSection) return;

    if(currentUser){
        userSection.innerHTML = `
          <span>👤 ${currentUser.user}</span>
          <a href="#" onclick="logout()">Logout</a>
          <a href="profile.html">Profile</a>
          <a href="cart.html">Cart</a>
        `;
    }
}
function logout(){
    localStorage.removeItem("currentUser");
    location.reload();
}
updateHeader();

// ------------------- Register / Login -------------------
function register(){
    let role = document.getElementById("role").value;
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;
    if(!user || !pass){ alert("Fill all fields"); return; }

    let users = JSON.parse(localStorage.getItem("users")) || [];
    if(users.find(u=>u.user===user)){ alert("Username exists"); return; }

    let newUser = {role,user,pass};
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    alert("Registered!");
    if(role==="seller") window.location.href="seller.html";
    else window.location.href="index.html";
}

function login(){
    let user = document.getElementById("loginUser").value;
    let pass = document.getElementById("loginPass").value;
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let found = users.find(u=>u.user===user && u.pass===pass);
    if(found){
        localStorage.setItem("currentUser", JSON.stringify(found));
        if(found.role==="seller") window.location.href="seller.html";
        else window.location.href="index.html";
    } else alert("Invalid Login!");
}

// ------------------- Products -------------------
function addProduct(){
    let pname=document.getElementById("pname").value;
    let price=parseFloat(document.getElementById("price").value);
    let offer=parseFloat(document.getElementById("offer").value);
    let imageInput=document.getElementById("pimage");
    if(!pname || !price || !offer || imageInput.files.length===0){alert("Fill all");return;}

    let reader=new FileReader();
    reader.onload=function(e){
        let imageData=e.target.result;
        let offerPrice=price-(price*offer/100);
        let products=JSON.parse(localStorage.getItem("products"))||[];
        let currentUser=JSON.parse(localStorage.getItem("currentUser"));
        let id=products.length>0?products[products.length-1].id+1:1;
        products.push({id,seller:currentUser.user,pname,price,offer,offerPrice,image:imageData});
        localStorage.setItem("products",JSON.stringify(products));
        alert("Product Added!");
        document.getElementById("pname").value="";
        document.getElementById("price").value="";
        document.getElementById("offer").value="";
        document.getElementById("pimage").value="";
        loadProducts();
    }
    reader.readAsDataURL(imageInput.files[0]);
}

function loadProducts(){
    let products=JSON.parse(localStorage.getItem("products"))||[];
    let div=document.getElementById("productList");
    if(!div) return;
    div.innerHTML="";
    products.forEach((p,i)=>{
        div.innerHTML+=`
        <div class="product">
          <img src="${p.image}" alt="${p.pname}">
          <h3>${p.pname}</h3>
          <p>Price: ${p.price} BDT</p>
          <p>Offer: ${p.offer}%</p>
          <p><b>Offer Price: ${p.offerPrice} BDT</b></p>
          <button onclick="addToCart(${i})">Add to Cart</button>
        </div>
        `;
    });
}
if(document.getElementById("productList")) loadProducts();

// ------------------- Cart -------------------
function addToCart(index){
    let currentUser=JSON.parse(localStorage.getItem("currentUser"));
    if(!currentUser || currentUser.role!=="buyer"){ alert("Only buyers can add to cart"); return; }
    let products=JSON.parse(localStorage.getItem("products"));
    let cart=JSON.parse(localStorage.getItem("cart"))||[];
    cart.push({...products[index], buyer:currentUser.user});
    localStorage.setItem("cart",JSON.stringify(cart));
    alert("Added to Cart");
}
function loadCart(){
    let cart=JSON.parse(localStorage.getItem("cart"))||[];
    let div=document.getElementById("cartItems");
    if(!div) return;
    div.innerHTML="";
    let total=0;
    cart.forEach(p=>{total+=p.offerPrice; div.innerHTML+=`<div class="cart-item">${p.pname} - ${p.offerPrice} BDT</div>`;});
    if(cart.length>0) div.innerHTML+=`<h3>Total: ${total} BDT</h3>`;
    checkoutSection();
}
if(document.getElementById("cartItems")) loadCart();

function checkoutSection(){
    let user=JSON.parse(localStorage.getItem("currentUser"));
    let div=document.getElementById("checkoutSection");
    if(!div) return;
    if(user){
        div.innerHTML=`<button onclick="completeOrder()">Pay & Complete Order</button>`;
    } else {
        div.innerHTML=`
          <h4>Guest Checkout</h4>
          <input type="text" id="gname" placeholder="Full Name"><br><br>
          <input type="text" id="gphone" placeholder="Phone"><br><br>
          <input type="text" id="gaddress" placeholder="Address"><br><br>
          <button onclick="guestCheckout()">Pay as Guest</button>
          <br><br>
          <a href="login.html">Login Instead</a>
        `;
    }
}

// Complete Order & Update Sales
function completeOrder(){
    let currentUser=JSON.parse(localStorage.getItem("currentUser"));
    let cart=JSON.parse(localStorage.getItem("cart"))||[];
    if(currentUser.role==="buyer"){
        let orders=JSON.parse(localStorage.getItem("orders"))||[];
        orders.push({buyer:currentUser.user,products:cart,date:new Date().toLocaleString()});
        localStorage.setItem("orders",JSON.stringify(orders));

        let sales=JSON.parse(localStorage.getItem("sales"))||[];
        cart.forEach(item=>{
            let sellerEntry=sales.find(s=>s.seller===item.seller);
            if(!sellerEntry){ sellerEntry={seller:item.seller,productsSold:[]}; sales.push(sellerEntry);}
            sellerEntry.productsSold.push({...item,buyer:currentUser.user,date:new Date().toLocaleString()});
        });
        localStorage.setItem("sales",JSON.stringify(sales));

        alert("Payment Successful!");
        localStorage.removeItem("cart");
        window.location.href="index.html";
    }
}
function guestCheckout(){
    let name=document.getElementById("gname").value;
    let phone=document.getElementById("gphone").value;
    let address=document.getElementById("gaddress").value;
    if(name && phone && address){
        alert("Guest Order Placed!");
        localStorage.removeItem("cart");
        window.location.href="index.html";
    } else alert("Fill all fields");
}

// ------------------- Search -------------------
function searchProducts(){
    let query=document.getElementById("searchInput").value.toLowerCase();
    let products=JSON.parse(localStorage.getItem("products"))||[];
    let div=document.getElementById("productList");
    if(!div) return;
    let filtered=products.filter(p=>p.pname.toLowerCase().includes(query));
    div.innerHTML="";
    if(filtered.length===0){ div.innerHTML="<p>No products found!</p>"; return; }
    filtered.forEach((p,i)=>{
        div.innerHTML+=`
        <div class="product">
          <img src="${p.image}" alt="${p.pname}">
          <h3>${p.pname}</h3>
          <p>Price: ${p.price} BDT</p>
          <p>Offer: ${p.offer}%</p>
          <p><b>Offer Price: ${p.offerPrice} BDT</b></p>
          <button onclick="addToCart(${i})">Add to Cart</button>
        </div>
        `;
    });
}

// ------------------- Delete Product -------------------
function deleteProduct(productId){
    let products=JSON.parse(localStorage.getItem("products"))||[];
    let currentUser=JSON.parse(localStorage.getItem("currentUser"));
    products=products.filter(p=>!(p.id===productId && p.seller===currentUser.user));
    localStorage.setItem("products",JSON.stringify(products));
    loadProducts();
}