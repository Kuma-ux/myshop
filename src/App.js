import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payoutMethod, setPayoutMethod] = useState("mpesa");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [sellerOrders, setSellerOrders] = useState([]);
  const [sellerMode, setSellerMode] = useState(false);
  const [paymentPage, setPaymentPage] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [sellMode, setSellMode] = useState(false);
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    openSellerDashboard(product.sellerId);
  };
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    dealText: "",
    image: "" 
  });

  // Safe parsing of localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  const API = "https://api.myshop24.site/api";

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ---------------- FETCH PRODUCTS ----------------
  const fetchProducts = () => {
    axios
      .get(`${API}/products`)
      .then((res) => setProducts(res.data))
      .catch(console.log);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ---------------- LOAD CART + ORDERS ----------------
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/cart`, { headers: { Authorization: token } })
      .then((res) => setCart(res.data))
      .catch(console.log);
    axios
      .get(`${API}/orders`, { headers: { Authorization: token } })
      .then((res) => setOrders(res.data))
      .catch(console.log);
  }, [token]);

  // ---------------- ADD TO CART ----------------
  const addToCart = (e, product) => {
    e.stopPropagation();
    if (!token) {
      setShowAuth(true);
      return;
    }
    axios
      .post(
        `${API}/cart/add`,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
          sellerId: product.sellerId
        },
        { headers: { Authorization: token } }
      )
      .then((res) => setCart(res.data))
      .catch(console.log);
  };

  // ---------------- REMOVE FROM CART ----------------
  const removeFromCart = (id) => {
    axios
      .post(
        `${API}/cart/remove`,
        { productId: id },
        { headers: { Authorization: token } }
      )
      .then((res) => setCart(res.data))
      .catch(console.log);
  };

  // ---------------- CHECKOUT ----------------
  const handleCheckout = async () => {
    if (!token) {
      setShowAuth(true);
      return;
    }
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    try {
      const res = await axios.post(
        `${API}/orders`,
        { items: cart, total },
        { headers: { Authorization: token } }
      );
      setPendingOrder(res.data);
      setPaymentPage(true);
    } catch (err) {
      console.log(err);
    }
  };

  // ---------------- SELL PRODUCT ----------------
  const handlePublishProduct = () => {
    axios
      .post(
        `${API}/products`,
        { ...newProduct, sellerId: user?._id },
        { headers: { Authorization: token } }
      )
      .then(() => {
        fetchProducts();
        setSellMode(false);
        setNewProduct({ 
         name: "",
         description: "",
         price: "",
         originalPrice: "",
         dealText: "",
         image: "" 
        });
      })
      .catch(console.log);
  };

  // ---------------- SELLER DASHBOARD ----------------
  const openSellerDashboard = (sellerId) => {
    setSelectedSeller(sellerId);
    axios
      .get(`${API}/products?seller=${sellerId}`)
      .then((res) => setSellerProducts(res.data))
      .catch(console.log);
  };

  // ---------------- LOGOUT ----------------
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.reload();
  };

  const fetchSellerOrders = useCallback(() => {
    axios
      .get(`${API}/orders/seller`, {
        headers: { Authorization: token },
      })
      .then((res) => setSellerOrders(res.data))
      .catch((err) => console.log(err));
  }, [token]);

  useEffect(() => {
    if (sellerMode && token) { fetchSellerOrders(); }
  }, [sellerMode, token, fetchSellerOrders]);

  const deleteProduct = (productId) => {
    axios
      .delete(`${API}/products/${productId}`, { headers: { Authorization: token } })
      .then(() => {
        fetchProducts();
        if (selectedSeller) {
          openSellerDashboard(selectedSeller);
        }
      })
      .catch((err) => console.log(err));
  };

  const savePayout = () => {
    if (payoutMethod === "mpesa" && !mpesaNumber) return alert("Enter M-Pesa number");
    if (payoutMethod === "paypal" && !paypalEmail) return alert("Enter PayPal email");
    axios
      .post(
        `${API}/seller/payout`,
        { payoutMethod, mpesaNumber, paypalEmail },
        { headers: { Authorization: token } }
      )
      .then(() => alert("Payout details saved ✅"))
      .catch(console.log);
  };

  const updateOrderStatus = (orderId, status) => {
    axios
      .put(
        `${API}/orders/status/${orderId}`,
        { status },
        { headers: { Authorization: token } }
      )
      .then((res) => {
        setSellerOrders(
            sellerOrders.map((o) => (o._id === orderId ? res.data : o))
        );
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="app">
      <header className="navbar">
        <h1 className="logo">MyShop</h1>
        <input 
          className="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div style={{ display: "flex", gap: "10px" }}>
          {!user ? (
            <button onClick={() => setShowAuth(true)}>Login / Signup</button>
          ) : (
            <>
              <button onClick={() => setSellerMode(!sellerMode)}>
                {sellerMode ? "Switch to Buyer" : "Seller Dashboard"}
              </button>
              <button onClick={() => setSellMode(true)}>Sell Item</button>
              <button onClick={handleLogout} style={{ background: "red", color: "white" }}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <div className="hero">
        <h2>Welcome {user ? user.name : "Guest"}</h2>
      </div>

      <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
        <div style={{ flex: 3 }}>
          {/* SELLER STORE VIEW */}
          {selectedSeller && (
            <div className="sellerDashboard">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>Viewing Seller's Store</h2>
                <button onClick={() => setSelectedSeller(null)}>← Back to All</button>
              </div>
              <div className="grid">
                {sellerProducts.map((p) => (
                  <div className="card" key={p._id}>
                    <img src={p.image} alt={p.name} />
                    <h3>{p.name}</h3>
                    <p>${p.price}</p>
                    <button onClick={(e) => addToCart(e, p)}>Add to Cart</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAIN PRODUCT LIST */}
          {!sellerMode && !selectedSeller && (
            <div className="grid">
              {filteredProducts.map((p) => (
                <div
                  className="card"
                  key={p._id}
                  onClick={() => handleProductClick(p)}
                  style={{ cursor: "pointer" }}
                >
                  <img src={p.image} alt={p.name} />
                  <h3>{p.name}</h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginTop: "5px"
                    }}
                  >
                    {p.description}
                  </p>
                  <div>
                    {p.originalPrice && (
                      <span
                        style={{
                          textDecoration: "line-through",
                          color: "#888",
                          marginRight: "8px"
                        }}
                      >
                        ${p.originalPrice}
                      </span>
                    )}

                    <span style={{ fontWeight: "bold", color: "green" }}>
                     ${p.price}
                    </span>
                  </div>
                  {p.dealText && (
                    <div
                      style={{
                        background: "#ff4444",
                        color: "white",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        display: "inline-block",
                        marginTop: "8px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      {p.dealText}
                    </div>
                  )}
                  <button onClick={(e) => addToCart(e, p)}>Add to Cart</button>
                </div>
              ))}
            </div>
          )}

          {/* PRODUCT DETAIL MODAL */}
          {selectedProduct && (
            <div className="authModal" onClick={() => setSelectedProduct(null)}>
              <div className="authBox" style={{ maxWidth: "500px", textAlign: "left" }} onClick={(e) => e.stopPropagation()}>
                <button className="closeBtn" onClick={() => setSelectedProduct(null)}>&times;</button>

                <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: "100%", borderRadius: "8px" }} />
                <h2 style={{ marginTop: "15px" }}>{selectedProduct.name}</h2>
                <p style={{ color: "#666", lineHeight: "1.6" }}>{selectedProduct.description}</p>

                <div style={{ margin: "20px 0", fontSize: "20px" }}>
                  <span style={{ fontWeight: "bold", color: "green" }}>${selectedProduct.price}</span>
                  {selectedProduct.originalPrice && (
                    <span style={{ textDecoration: "line-through", color: "#888", marginLeft: "10px", fontSize: "16px" }}>
                      ${selectedProduct.originalPrice}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn"
                    onClick={(e) => { addToCart(e, selectedProduct); setSelectedProduct(null); }}
                    style={{ flex: 1 }}
                  >
                    Add to Cart
                  </button>

                  {/* DELETE BUTTON: Only visible if the logged-in user is the seller */}
                  {user && user._id === selectedProduct.sellerId && (
                    <button
                      onClick={() => {
                        if(window.confirm("Are you sure you want to delete this?")) {
                          deleteProduct(selectedProduct._id);
                          setSelectedProduct(null);
                        }
                      }}
                      style={{ background: "#ff4444", color: "white", padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer" }}
                    >
                      Delete Product
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SELLER DASHBOARD PANEL */}
          {sellerMode && (
            <div className="sellerPanel">
              <h2>My Sales Orders 📦</h2>
              <button onClick={() => setSellerMode(false)} style={{ marginBottom: "20px" }}>
                ← Back
              </button>
              
              <div style={{ background: "#f4f4f4", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                <h3>💳 Payout Settings</h3>
                <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} style={{ padding: "8px", marginBottom: "10px", width: "100%" }}>
                  <option value="mpesa">M-Pesa</option>
                  <option value="paypal">PayPal</option>
                </select>
                {payoutMethod === "mpesa" && (
                  <input placeholder="Enter M-Pesa Number (2547...)" value={mpesaNumber} onChange={(e) => setMpesaNumber(e.target.value)} style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }} />
                )}
                {payoutMethod === "paypal" && (
                  <input placeholder="Enter PayPal Email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }} />
                )}
                <button onClick={savePayout} style={{ background: "green", color: "white", padding: "10px", width: "100%", cursor: "pointer", border: "none" }}>
                  Save Payout Details
                </button>
              </div>

              {sellerOrders.length === 0 ? <p>No orders yet</p> : sellerOrders.map((order) => (
                <div key={order._id} className="orderCard" style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
                  <p><b>Order ID:</b> {order._id}</p>
                  <p><b>Total:</b> ${order.total}</p>
                  <p><b>Status:</b> {order.status}</p>
                  <div style={{ marginTop: "10px", display: "flex", gap: "5px" }}>
                    <button onClick={() => updateOrderStatus(order._id, "processing")}>Processing</button>
                    <button onClick={() => updateOrderStatus(order._id, "shipped")}>Shipped</button>
                    <button onClick={() => updateOrderStatus(order._id, "delivered")}>Delivered</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={{ flex: 1, borderLeft: "1px solid #ddd", paddingLeft: "20px" }}>
          <div>
            <h2>Cart 🛒</h2>
            {cart.length === 0 ? <p>Empty cart</p> : (
              <>
                {cart.map((i) => (
                  <div key={i.productId || i._id} style={{ marginBottom: "10px" }}>
                    <p><b>{i.name}</b></p>
                    <p>${i.price} x {i.quantity}</p>
                    <button onClick={() => removeFromCart(i.productId)}>Remove</button>
                  </div>
                ))}
                <h3>Total: ${cart.reduce((a, i) => a + i.price * i.quantity, 0).toFixed(2)}</h3>
                <button onClick={handleCheckout}>Checkout</button>
              </>
            )}
          </div>

          <div style={{ marginTop: "40px" }}>
            <h2>My Purchases 📦</h2>
            {orders.length === 0 ? <p>No orders yet</p> : orders.map((o) => (
              <div key={o._id} style={{ borderBottom: "1px solid #eee", paddingBottom: "5px" }}>
                <p>Total: ${o.total} - Status: {o.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showAuth && (
        <div className="authModal" onClick={() => setShowAuth(false)}>
          <div className="authBox" onClick={(e) => e.stopPropagation()}>
            <button className="closeBtn" onClick={() => setShowAuth(false)}>
              &times;
            </button>
            {authMode === "login" ? (
              <Login switchToRegister={() => setAuthMode("register")} />
            ) : (
              <Register switchToLogin={() => setAuthMode("login")} />
            )}
          </div>
        </div>
      )}

      {paymentPage && pendingOrder && (
        <div className="paymentPage">
          <div className="paymentBox">
            <h2>Choose Payment Method 💳</h2>
            <p>Total: ${pendingOrder.total}</p>
            <button className="btn" onClick={async () => {
              const res = await axios.post(`${API}/orders/pay/stripe`, { orderId: pendingOrder._id }, { headers: { Authorization: token } });
              window.location.href = res.data.url;
            }}>Pay with Stripe 💳</button>
            <button onClick={() => setPaymentPage(false)} style={{ marginTop: "10px", background: "#999" }}>Cancel</button>
          </div>
        </div>
      )}

      {sellMode && (
        <div className="sellModal" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="modalContent" style={{ background: "white", padding: "20px", borderRadius: "8px" }}>
            <h2>Sell Product</h2>
            <input placeholder="Name" style={{ display: "block", marginBottom: "10px" }} value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
            <input placeholder="Price" style={{ display: "block", marginBottom: "10px" }} value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
            <input
              placeholder="Original Price (optional)"
              style={{ display: "block", marginBottom: "10px" }}
              value={newProduct.originalPrice}
              onChange={(e) =>
                setNewProduct({
                 ...newProduct,
                 originalPrice: e.target.value
                })
              }
            />
            <textarea
              placeholder="Product Description"
              style={{
                display: "block",
                marginBottom: "10px",
                width: "100%",
                minHeight: "80px"
              }}
              value={newProduct.description}
              onChange={(e) =>
               setNewProduct({
               ...newProduct,
               description: e.target.value
              })
            }
           />
            <input
              placeholder="Deal Text (e.g. 50% OFF 🔥)"
              style={{ display: "block", marginBottom: "10px" }}
              value={newProduct.dealText}
              onChange={(e) =>
                setNewProduct({
                 ...newProduct,
                 dealText: e.target.value
                })
              }
            />
            <input placeholder="Image URL" style={{ display: "block", marginBottom: "10px" }} value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} />
            <button onClick={handlePublishProduct}>Publish</button>
            <button onClick={() => setSellMode(false)} style={{ marginLeft: "10px" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
