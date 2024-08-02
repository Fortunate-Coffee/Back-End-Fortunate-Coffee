const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const {
  ApplicationController,
  AuthenticationController,
  CategoryController,
  MenuController,
  FoodIngredientsController,
  DetailFoodIngredientsController,
  MenuIngredientsController,
  OrderController,
  DetailOrderController,
  CartController
} = require("./controllers");

const { 
  user_acc,
  category,
  menu,
  food_ingredients,
  detail_food_ingredients,
  menu_ingredients,
  order,
  detail_order
} = require("./models");

const uploader = require("./middleware/uploader");

function apply(app) {
  const userModel = user_acc;
  const categoryModel = category;
  const menuModel = menu;
  const foodIngredientsModel = food_ingredients;
  const detailFoodIngredientsModel = detail_food_ingredients;
  const menuIngredientsModel = menu_ingredients;
  const orderModel = order;
  const detailOrderModel = detail_order;

  const applicationController = new ApplicationController();
  const authenticationController = new AuthenticationController({ bcrypt, jwt, userModel });
  const accessControl = authenticationController.accessControl;
  const categoryController = new CategoryController({ categoryModel, menuModel });
  const menuController = new MenuController({ categoryModel, menuModel, foodIngredientsModel, menuIngredientsModel });
  const foodIngredientsController = new FoodIngredientsController({ foodIngredientsModel, detailFoodIngredientsModel });
  const detailFoodIngredientsController = new DetailFoodIngredientsController({ foodIngredientsModel, detailFoodIngredientsModel });
  const menuIngredientsController = new MenuIngredientsController({ menuModel, foodIngredientsModel, menuIngredientsModel });
  const orderController = new OrderController({ userModel, orderModel, detailOrderModel, menuIngredientsModel, foodIngredientsModel, detailFoodIngredientsModel });
  const detailOrderController = new DetailOrderController({ foodIngredientsModel, menuIngredientsModel, orderModel, detailOrderModel, detailFoodIngredientsModel, menuModel });
  const cartController = new CartController({ menuModel });

  // Root route
  app.get("/", applicationController.handleGetRoot);

  // Auth routes
  app.post("/v1/auth/login", authenticationController.handleLogin);
  app.get("/v1/auth/whoami", authenticationController.handleGetUser);

  // Category routes
  app.route("/api/v1/category")
    .post(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), uploader.single('category_image'), categoryController.handleCreateCategory)
    .get(categoryController.handleListCategory);
  
  app.get("/api/v1/category-used", categoryController.handleListCategoryInUse);

  app.route("/api/v1/category/:id")
    .get(categoryController.handleGetCategory)
    .put(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), uploader.single('category_image'), categoryController.handleUpdateCategory)
    .delete(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), categoryController.handleDeleteCategory);

  // Menu routes
  app.route("/api/v1/menu")
    .post(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), uploader.single('menu_image'), menuController.handleCreateMenu)
    .get(menuController.handleListMenu);

  app.route("/api/v1/menu/:id")
    .get(menuController.handleGetMenu)
    .put(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), uploader.single('menu_image'), menuController.handleUpdateMenu)
    .delete(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), menuController.handleDeleteMenu);
  
  app.get("/api/v1/menu/category/:id", menuController.handleGetMenuByCategoryId);
  app.get("/api/v1/find-menu/search", menuController.handleSearch);

  // Food Ingredients routes
  app.route("/api/v1/food-ingredients")
    .post(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), foodIngredientsController.handleCreateFoodIngredients)
    .get(foodIngredientsController.handleListFoodIngredients);

  app.route("/api/v1/food-ingredients/:id")
    .get(foodIngredientsController.handleGetFoodIngredients)
    .put(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), foodIngredientsController.handleUpdateFoodIngredients)
    .delete(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), foodIngredientsController.handleDeleteFoodIngredients);

  app.get("/api/v1/food-ingredients-used", foodIngredientsController.handleListFoodIngredientsInStock);

  // Filtered food ingredients route
  app.route("/api/v1/filtered-food-ingredients")
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), foodIngredientsController.handleGetFilteredFoodIngredients);
    
  // Detail Food Ingredients routes
  app.route("/api/v1/type-food-ingredients")
    .post(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), detailFoodIngredientsController.handleCreateDetailFoodIngredients)
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), detailFoodIngredientsController.handleListDetailFoodIngredients);

  app.route("/api/v1/type-food-ingredients/:id")
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), detailFoodIngredientsController.handleGetDetailFoodIngredients);

  // Menu Ingredients routes
  app.route("/api/v1/menu-ingredients")
    .post(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), menuIngredientsController.handleCreateMenuIngredients)
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), menuIngredientsController.handleListMenuIngredients);

  app.route("/api/v1/menu-ingredients/:id")
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), menuIngredientsController.handleGetMenuIngredients);

  app.route("/api/v1/menu-ingredients/:menu_id/ingredients")
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), menuIngredientsController.handleGetMenuIngredientsByMenuID)
    .put(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.ADMIN]), menuIngredientsController.handleUpdateMenuIngredients);

  // Cart routes
  app.post("/api/v1/cart/checkout", cartController.handleCheckout);
  
  app.route("/api/v1/cart/:menuId")
    .get(cartController.getCartByMenuId)
    .delete(cartController.deleteFromCart);

  app.route("/api/v1/cart")
    .post(cartController.addToCart)
    .put(cartController.updateCartItem)
    .get(cartController.handleGetCart);

  // Order routes
  app.route("/api/v1/order")
    .post(orderController.handleCreateOrder)
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.CASHIER]), orderController.handleListOrder);

  app.route("/api/v1/order/:id")
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.CASHIER]), orderController.handleGetOrder)
    .put(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.CASHIER]), orderController.handleUpdateOrder)
    .delete(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.CASHIER]), orderController.handleDeleteScheduledOrder);

  // Filtered order route
  app.route("/api/v1/filtered-order")
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.CASHIER]), orderController.handleGetFilteredOrder)
 
  // Detail Order routes
  app.route("/api/v1/detail-order")
    .post(detailOrderController.handleCreateDetailOrder)
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.CASHIER]), detailOrderController.handleListDetailOrder);

  app.route("/api/v1/detail-order/:id")
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.CASHIER]), detailOrderController.handleGetDetailOrder);

  app.route("/api/v1/detail-order/:order_id/order")
    .get(authenticationController.authorizeRoles([accessControl.OWNER, accessControl.CASHIER]), detailOrderController.handleGetDetailOrderByOrderID);

  // Error handling
  app.use(applicationController.handleNotFound);
  app.use(applicationController.handleError);

  return app;
}

module.exports = { apply }
