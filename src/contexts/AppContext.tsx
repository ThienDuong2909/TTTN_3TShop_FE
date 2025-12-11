import React, { createContext, useContext, useReducer, useEffect } from "react";
import { CartItem, User } from "../types";
import { Product } from "../components/ProductCard";
import { removeFromCartApi, getCartItemsApi } from "../services/api";
import { clearCartApi } from "../services/api";
interface AppState {
  cart: CartItem[];
  user: User | null;
  wishlist: number[];
  isLoading: boolean;
  searchQuery: string;
  isInitialized: boolean;
}

type AppAction =
  | {
    type: "ADD_TO_CART";
    product: Product;
    quantity?: number;
    color?: string;
    size?: string;
  }
  | {
    type: "REMOVE_FROM_CART";
    productId: number;
    color?: string;
    size?: string;
  }
  | { type: "UPDATE_CART_QUANTITY"; productId: number; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_WISHLIST"; productId: number }
  | { type: "SET_USER"; user: User | null }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_SEARCH_QUERY"; query: string }
  | { type: "SET_INITIALIZED"; isInitialized: boolean }
  | { type: "LOAD_PERSISTED_STATE"; state: Partial<AppState> }
  | { type: "SET_CART_FROM_BACKEND"; cart: CartItem[] };

const initialState: AppState = {
  cart: [],
  user: null,
  wishlist: [],
  isLoading: false,
  searchQuery: "",
  isInitialized: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItemIndex = state.cart.findIndex(
        (item) =>
          item.product.id === action.product.id &&
          item.selectedColor === action.color &&
          item.selectedSize === action.size
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...state.cart];
        updatedCart[existingItemIndex].quantity += action.quantity || 1;
        return { ...state, cart: updatedCart };
      }

      const newItem: CartItem = {
        product: action.product,
        quantity: action.quantity || 1,
        selectedColor: action.color,
        selectedSize: action.size,
      };

      return { ...state, cart: [...state.cart, newItem] };
    }
    case "SET_CART_FROM_BACKEND":
      return {
        ...state,
        cart: action.cart.map((item) => ({
          ...item,
          product: {
            ...item.product,
            price: item.product.price ?? 0,
          },
        })),
      };

    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter(
          (item) =>
            !(
              item.product.id === action.productId &&
              item.selectedColor === action.color &&
              item.selectedSize === action.size
            )
        ),
      };

    case "UPDATE_CART_QUANTITY":
      return {
        ...state,
        cart: state.cart
          .map((item) =>
            item.product.id === action.productId
              ? { ...item, quantity: Math.max(0, action.quantity) }
              : item
          )
          .filter((item) => item.quantity > 0),
      };

    case "CLEAR_CART":
      return { ...state, cart: [] };

    case "TOGGLE_WISHLIST": {
      const isInWishlist = state.wishlist.includes(action.productId);
      return {
        ...state,
        wishlist: isInWishlist
          ? state.wishlist.filter((id) => id !== action.productId)
          : [...state.wishlist, action.productId],
      };
    }

    case "SET_USER":
      return { ...state, user: action.user };

    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.query };

    case "SET_INITIALIZED":
      return { ...state, isInitialized: action.isInitialized };

    case "LOAD_PERSISTED_STATE":
      return { ...state, ...action.state, isInitialized: true };

    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  addToCart: (
    product: Product,
    quantity?: number,
    color?: string,
    size?: string
  ) => void;
  removeFromCart: (
    productId: number,
    color: string,
    size: string,
    donGia: number
  ) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: number) => void;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setSearchQuery: (query: string) => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  isInWishlist: (productId: number) => boolean;
  setCartFromBackend: (cart: CartItem[]) => void;
  clearCartFully: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted state on mount
  useEffect(() => {
    const persistedCart = localStorage.getItem("fashionhub-cart");
    const persistedWishlist = localStorage.getItem("fashionhub-wishlist");
    const persistedUser = localStorage.getItem("fashionhub-user");

    const persistedState: Partial<AppState> = {};

    if (persistedCart) {
      try {
        persistedState.cart = JSON.parse(persistedCart);
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }

    if (persistedWishlist) {
      try {
        persistedState.wishlist = JSON.parse(persistedWishlist);
      } catch (error) {
        console.error("Error loading wishlist from localStorage:", error);
      }
    }

    if (persistedUser) {
      try {
        persistedState.user = JSON.parse(persistedUser);
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
      }
    }

    if (Object.keys(persistedState).length > 0) {
      dispatch({ type: "LOAD_PERSISTED_STATE", state: persistedState });
    } else {
      dispatch({ type: "SET_INITIALIZED", isInitialized: true });
    }
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem("fashionhub-cart", JSON.stringify(state.cart));
  }, [state.cart]);

  // Persist wishlist to localStorage
  useEffect(() => {
    localStorage.setItem("fashionhub-wishlist", JSON.stringify(state.wishlist));
  }, [state.wishlist]);

  // Persist user to localStorage
  useEffect(() => {
    if (state.user) {
      console.log("Persisting user to localStorage:", state.user);
      localStorage.setItem("fashionhub-user", JSON.stringify(state.user));
    } else {
      localStorage.removeItem("fashionhub-user");
    }
  }, [state.user]);

  const addToCart = (
    product: Product,
    quantity = 1,
    color?: string,
    size?: string
  ) => {
    dispatch({ type: "ADD_TO_CART", product, quantity, color, size });
  };
  const setCartFromBackend = (cart: CartItem[]) => {
    dispatch({ type: "SET_CART_FROM_BACKEND", cart });
  };

  const clearCartFully = async () => {
    if (!state.user) return;
    try {
      await clearCartApi(Number(state.user.id));
      dispatch({ type: "CLEAR_CART" });
    } catch (error) {
      console.error("Không thể xoá giỏ hàng:", error);
      alert("Xoá tất cả sản phẩm trong giỏ hàng thất bại.");
    }
  };

  const removeFromCart = async (
    productId: number,
    color: string,
    size: string,
    donGia: number
  ) => {
    if (!state.user) return;

    try {
      console.log("Removing from cart:", { productId, color, size, donGia });
      await removeFromCartApi(
        Number(state.user.id),
        productId,
        color,
        size,
        donGia
      );
      dispatch({
        type: "REMOVE_FROM_CART",
        productId,
        color,
        size,
      });
    } catch (error) {
      console.error("Không thể xoá sản phẩm:", error);
      alert("Xoá sản phẩm khỏi giỏ hàng thất bại.");
    }
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    dispatch({ type: "UPDATE_CART_QUANTITY", productId, quantity });
  };

  const refreshCart = async () => {
    try {
      if (!state.user) return;

      const res = await getCartItemsApi(state.user.id);
      const groupedMap = new Map<string, CartItem>();

      for (const item of res.items) {
        const productId = item.maCTSP;
        const color = item.mau?.hex;
        const size = item.kichThuoc?.ten;
        const donGia = Number(item.donGia ?? 0);

        const key = `${productId}-${color}-${size}-${donGia}`;

        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            product: {
              id: productId,
              name: item.sanPham?.tenSP || "Tên SP",
              price: donGia,
              originalPrice: undefined,
              image: item.anhSanPham,
              rating: 4.5,
              reviews: 0,
              totalSold: 0,
              discount: 0,
              isNew: false,
              isBestSeller: false,
              category: "",
              colors: [],
              sizes: [],
            },
            quantity: item.soLuong,
            selectedColor: color,
            selectedSize: size,
          });
        } else {
          const existing = groupedMap.get(key)!;
          existing.quantity += item.soLuong;
        }
      }

      setCartFromBackend(Array.from(groupedMap.values()));
    } catch (err) {
      console.error("Lỗi khi refresh giỏ hàng:", err);
    }
  };

  // Automatically refresh cart when user changes (e.g. on load)
  useEffect(() => {
    if (state.user) {
      refreshCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user?.id]);

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const toggleWishlist = (productId: number) => {
    dispatch({ type: "TOGGLE_WISHLIST", productId });
  };

  const setUser = (user: User | null) => {
    dispatch({ type: "SET_USER", user });
  };

  const setLoading = (isLoading: boolean) => {
    dispatch({ type: "SET_LOADING", isLoading });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", query });
  };

  const getCartTotal = () => {
    return state.cart.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  const getCartItemsCount = () => {
    return state.cart.reduce((count, item) => count + item.quantity, 0);
  };

  const isInWishlist = (productId: number) => {
    return state.wishlist.includes(productId);
  };

  const value: AppContextType = {
    state,
    addToCart,
    setCartFromBackend,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    toggleWishlist,
    setUser,
    setLoading,
    setSearchQuery,
    getCartTotal,
    getCartItemsCount,
    isInWishlist,
    clearCartFully,
    refreshCart,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
