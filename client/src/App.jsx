import { useState, useEffect } from "react";
import Register from "./Register"; 
import Login from "./Login";


function App() {
  const [auth, setAuth] = useState({});
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showRegister, setShowRegister] = useState(false); 
  
  useEffect(() => {
    attemptLoginWithToken();
  }, []);

  const attemptLoginWithToken = async () => {
    const token = window.localStorage.getItem("token");
    if (token) {
      const response = await fetch(`/api/auth/me`, {
        headers: {
          authorization: token,
        },
      });
      const json = await response.json();
      if (response.ok) {
        setAuth(json);
      } else {
        window.localStorage.removeItem("token");
      }
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch("/api/products");
      const json = await response.json();
      setProducts(json);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      const response = await fetch(`/api/users/${auth.id}/favorites`, {
        headers: {
          authorization: window.localStorage.getItem("token"),
        },
      });
      const json = await response.json();
      if (response.ok) {
        setFavorites(json);
      } else {
        console.log("JSON ----> ", json);
      }
    };
    if (auth.id) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [auth]);

  const login = async (credentials) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await response.json();
    if (response.ok) {
      window.localStorage.setItem("token", json.token);
      attemptLoginWithToken();
      
    } else {
       throw new Error(json.error || "Failed to login");  
      
    }
  };

  const register = async (credentials) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await response.json();
    if (response.ok) {
      // Automatically log in after registration
      window.localStorage.setItem("token", json.token);
      attemptLoginWithToken();
      setShowRegister(false); // Hide the registration form
    } else {
       throw new Error(json.error || "Failed to register");
    }
  };

  const addFavorite = async (product_id) => {
    const response = await fetch(`/api/users/${auth.id}/favorites`, {
      method: "POST",
      body: JSON.stringify({ product_id }),
      headers: {
        "Content-Type": "application/json",
        authorization: window.localStorage.getItem("token"),
      },
    });

    const json = await response.json();
    if (response.ok) {
      setFavorites([...favorites, json]);
    } else {
      console.log(json);
    }
  };

  const removeFavorite = async (id) => {
    try {
      const token = window.localStorage.getItem("token");
      
      const response = await fetch(`/api/users/${auth.id}/favorites/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setFavorites(favorites.filter((favorite) => favorite.id !== id));
      } else {
        const errorJson = await response.json();
        console.log("Error removing favorite:", errorJson);
        // Handle error state in your application (e.g., show error message)
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      // Handle unexpected errors (e.g., network issue, server down)
    }
  };

  const logout = () => {
    window.localStorage.removeItem("token");
    setAuth({});
    
  };

  return (
    <>
      {!auth.id ? (
        <>
          {!showRegister ? (
            <>
              <Login login={login} />
              <button onClick={() => setShowRegister(true)}>Register</button>
              
            </>
          ) : (
            <>
              <Register register={register} />
              <button onClick={() => setShowRegister(false)}>Login</button>
            </>
          )}
        </>
      ) : (
        <button onClick={logout}>Logout {auth.username}</button>
      )}
      <ul>
        {products.map((product) => {
          const isFavorite = favorites.find(
            (favorite) => favorite.product_id === product.id
          );
          return (
            <li key={product.id} className={isFavorite ? "favorite" : ""}>
              {product.name}
              {auth.id && isFavorite && (
                <button onClick={() => removeFavorite(isFavorite.id)}>-</button>
              )}
              {auth.id && !isFavorite && (
                <button onClick={() => addFavorite(product.id)}>+</button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default App;
