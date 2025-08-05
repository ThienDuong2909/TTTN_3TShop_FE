import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { Search, ShoppingCart, User, Menu, X, Heart, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { ThemeToggle } from "./ThemeToggle";

function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { state, getCartItemsCount, setSearchQuery, setUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = getCartItemsCount();
  const isLoggedIn = !!state.user;

  const navigation: any = [
    // { name: "Trang chủ", href: "/", current: location.pathname === "/" },
    // { name: "Nam", href: "/nam", current: location.pathname === "/nam" },
    // { name: "Nữ", href: "/nu", current: location.pathname === "/nu" },
    // {
    //   name: "Trẻ em",
    //   href: "/tre-em",
    //   current: location.pathname === "/tre-em",
    // },
    // { name: "Sale", href: "/sale", current: location.pathname === "/sale" },
    // {
    //   name: "Liên hệ",
    //   href: "/lien-he",
    //   current: location.pathname === "/lien-he",
    // },
  ];

  const NavLinks = ({ mobile = false }) => (
    <>
      {navigation.map((item: any) => (
        <Link
          key={item.name}
          to={item.href}
          className={`${
            item.current
              ? "text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400"
              : "text-gray-600 hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-400"
          } ${
            mobile
              ? "block px-3 py-2 text-base font-medium border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
              : "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
          }`}
        >
          {item.name}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      {/* <div className="border-b bg-brand-50 dark:bg-brand-900/20">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="text-brand-700 dark:text-brand-300">
              Miễn phí vận chuyển cho đơn hàng trên 500K
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {(state.user?.role === "admin" ||
                state.user?.role === "staff") && (
                <>
                  <Link
                    to="/admin"
                    className="text-brand-700 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-100"
                  >
                    {state.user.role === "admin" ? "Quản trị" : "Nhân viên"}
                  </Link>
                  <span className="text-brand-300">|</span>
                </>
              )}
              <Link
                to="/support"
                className="text-brand-700 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-100"
              >
                Hỗ trợ
              </Link>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                FashionHub
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            <NavLinks />
          </nav>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-10 pr-4 py-2 w-full"
                value={state.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && state.searchQuery.trim()) {
                    navigate(
                      `/search?keyword=${encodeURIComponent(state.searchQuery)}`
                    );
                  }
                }}
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            {/* <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                2
              </Badge>
            </Button> */}

            {/* Wishlist */}
            {/* <Button variant="ghost" size="sm" className="relative">
              <Heart className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                5
              </Badge>
            </Button> */}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Shopping Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 text-xs">
                    {cartItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Account */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <div>{state.user?.name}</div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {state.user?.role === "Admin" && "Quản trị viên"}
                        {state.user?.role === "NhanVienCuaHang" &&
                          "Nhân viên cửa hàng"}
                        {state.user?.role === "KhachHang" && "Khách hàng"}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {(state.user?.role === "Admin" ||
                    state.user?.role === "NhanVienCuaHang") && (
                    <>
                      <DropdownMenuItem>
                        <Link to="/admin">Bảng điều khiển</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem>
                    <Link to="/profile">Thông tin cá nhân</Link>
                  </DropdownMenuItem>

                  {state.user?.role === "KhachHang" && (
                    <>
                      <DropdownMenuItem>
                        <Link to="/orders">Đơn hàng của tôi</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link to="/wishlist">Danh sách yêu thích</Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setUser(null);
                      navigate("/");
                    }}
                  >
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-700">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  <NavLinks mobile />
                  <div className="border-t pt-4">
                    {!isLoggedIn && (
                      <div className="flex flex-col space-y-2">
                        <Link to="/login">
                          <Button variant="outline" className="w-full">
                            Đăng nhập
                          </Button>
                        </Link>
                        <Link to="/register">
                          <Button className="w-full bg-brand-600 hover:bg-brand-700">
                            Đăng ký
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile search */}
        {isSearchOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-10 pr-4 py-2 w-full"
                value={state.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && state.searchQuery.trim()) {
                    navigate(
                      `/search?q=${encodeURIComponent(state.searchQuery)}`
                    );
                    setIsSearchOpen(false);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
