/** Mila site shell: routes a unified Navy Atelier home and bilingual catalog experience. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Fashion from "@/pages/Fashion";
import Home from "@/pages/Home";
import HomeDeco from "@/pages/HomeDeco";
import NewArrivals from "@/pages/NewArrivals";
import Shop from "@/pages/Shop";
import Stickers from "@/pages/Stickers";
import Wallpapers from "@/pages/Wallpapers";
import AdminDashboard from "@/pages/AdminDashboard";
import CartDrawer from "@/components/shop/CartDrawer";
import CheckoutPreview from "@/pages/CheckoutPreview";
import OrderTracking from "@/pages/OrderTracking";
import StickerCheckout from "@/pages/StickerCheckout";
import CashMemo from "@/pages/CashMemo";
import DecorPreview from "@/pages/DecorPreview";
import AdminFinance from "@/pages/AdminFinance";
import AdminWebsiteManagement from "@/pages/AdminWebsiteManagement";
import Account from "@/pages/Account";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/shop" component={Shop} />
    <Route path="/checkout-preview" component={CheckoutPreview} />
    <Route path="/track-order" component={OrderTracking} />
    <Route path="/stickers" component={Stickers} />
    <Route path="/sticker-order" component={StickerCheckout} />
    <Route path="/cash-memo" component={CashMemo} />
    <Route path="/decor-preview" component={DecorPreview} />
    <Route path="/account" component={Account} />
    <Route path="/wallpapers" component={Wallpapers} />
    <Route path="/home-deco" component={HomeDeco} />
    <Route path="/fashion" component={Fashion} />
    <Route path="/new-arrivals" component={NewArrivals} />
    <Route path="/admin" component={AdminDashboard} />
    <Route path="/admin/orders" component={AdminDashboard} />
    <Route path="/admin/services" component={AdminDashboard} />
    <Route path="/admin/home-service" component={AdminDashboard} />
    <Route path="/admin/products" component={AdminDashboard} />
    <Route path="/admin/finance" component={AdminFinance} />
    <Route path="/admin/site" component={AdminWebsiteManagement} />
    <Route path="/admin/website-management" component={AdminWebsiteManagement} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /><CartDrawer /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
