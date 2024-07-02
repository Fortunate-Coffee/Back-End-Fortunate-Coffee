const ApplicationController = require('./ApplicationController');

class CartController extends ApplicationController {
  constructor({ menuModel }) {
    super();
    this.menuModel = menuModel;
    this.cart = []; // Temporary storage for cart items
  }

  addToCart = async (req, res) => {
    try {
      const { menu_id, cart_qty, notes } = req.body;

      // Check if the item is already in the cart
      const existingItem = this.cart.find(item => item.menu_id === menu_id);

      if (existingItem) {
        // If the item is already in the cart, increase the quantity
        existingItem.cart_qty += cart_qty;
        existingItem.notes = notes; // Update notes if needed
      } else {
        // Add new item to cart
        this.cart.push({ menu_id, cart_qty, notes });
      }

      res.status(201).json({
        status: 'success',
        message: 'Item added to cart',
        data: this.cart
      });
    } catch (error) {
      res.status(500).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  updateCartItem = async (req, res) => {
    try {
      const { menu_id, cart_qty, notes } = req.body;

      // Check if the item is in the cart
      const existingItem = this.cart.find(item => item.menu_id === menu_id);

      if (existingItem) {
        // Update the quantity and notes
        existingItem.cart_qty = cart_qty;
        existingItem.notes = notes;

        res.status(200).json({
          status: 'success',
          message: 'Cart item updated successfully',
          data: this.cart
        });
      } else {
        res.status(404).json({ error: 'Item not found in the cart' });
      }
    } catch (error) {
      res.status(500).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  handleCheckout = async (req, res) => {
    try {
      const cartItems = this.cart;  // Array of items from cart

      // Fetch menu details from database
      const menuIds = cartItems.map(item => item.menu_id);
      const menus = await this.menuModel.findAll({
        where: { menu_id: menuIds }
      });

      if (menus.length !== menuIds.length) {
        return res.status(400).json({ error: 'Some items are not found in the menu' });
      }

      // Process the order
      const orderDetails = cartItems.map(cartItem => {
        const menuItem = menus.find(menu => menu.menu_id === cartItem.menu_id);
        return {
          menu_id: menuItem.menu_id,
          menu_name: menuItem.menu_name,
          menu_price: menuItem.menu_price,
          menu_image: menuItem.menu_image,
          quantity: cartItem.cart_qty,
          notes: cartItem.notes, // Include notes in the order details
          total: menuItem.menu_price * cartItem.cart_qty
        };
      });

      // Clear the cart after checkout
      this.cart = [];

      res.status(201).json({
        status: 'success',
        message: 'Order placed successfully',
        data: orderDetails
      });
    } catch (error) {
      res.status(500).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  handleGetCart = async (req, res) => {
    try {
      // If the cart is empty, respond with an empty cart
      if (this.cart.length === 0) {
        return res.status(200).json({
          status: 'success',
          message: 'Cart is empty',
          data: []
        });
      }

      const uniqueMenuIds = [...new Set(this.cart.map(item => item.menu_id))];

      // Fetch menu details from database
      const menus = await this.menuModel.findAll({
        where: { menu_id: uniqueMenuIds }
      });

      if (menus.length !== uniqueMenuIds.length) {
        return res.status(400).json({ error: 'Some items are not found in the menu' });
      }

      const cartDetails = this.cart.map(cartItem => {
        const menuItem = menus.find(menu => menu.menu_id === cartItem.menu_id);
        return {
          menu_id: menuItem.menu_id,
          menu_name: menuItem.menu_name,
          menu_price: menuItem.menu_price,
          menu_image: menuItem.menu_image,
          quantity: cartItem.cart_qty,
          notes: cartItem.notes, // Include notes in the cart details
          total: menuItem.menu_price * cartItem.cart_qty
        };
      });

      res.status(200).json({
        status: 'success',
        message: 'Cart fetched successfully',
        data: cartDetails
      });
    } catch (error) {
      res.status(500).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  getCartByMenuId = async (req, res) => {
    try {
      const menuId = parseInt(req.params.menuId);

      // Cari item di keranjang berdasarkan menuId
      const cartItem = this.cart.find(cartItem => cartItem.menu_id === menuId);
      console.log(cartItem);

      if (!cartItem) {
        return res.status(404).json({ error: 'Item not found in the cart' });
      }

      // Temukan menu terkait dari database (gunakan this.menuModel)
      const menu = await this.menuModel.findOne({
        where: { menu_id: menuId }
      });

      if (!menu) {
        return res.status(404).json({ error: 'Menu not found' });
      }

      // Format data yang akan dikembalikan
      const cartItemDetails = {
        menu_id: cartItem.menu_id,
        menu_name: menu.menu_name,
        menu_price: menu.menu_price,
        menu_image: menuItem.menu_image,
        quantity: cartItem.cart_qty,
        notes: cartItem.notes,
        total: menu.menu_price * cartItem.cart_qty
      };

      res.status(200).json({
        status: 'success',
        message: 'Cart item fetched successfully',
        data: cartItemDetails
      });
    } catch (error) {
      res.status(500).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  deleteFromCart = async (req, res) => {
    try {
      const menuId = parseInt(req.params.menuId);

      // Cari item di keranjang berdasarkan menuId
      const itemIndex = this.cart.findIndex(cartItem => cartItem.menu_id === menuId);

      if (itemIndex === -1) {
        return res.status(404).json({ error: 'Item not found in the cart' });
      }

      // Hapus item dari keranjang
      this.cart.splice(itemIndex, 1);

      res.status(200).json({
        status: 'success',
        message: 'Item removed from cart',
        data: this.cart
      });
    } catch (error) {
      res.status(500).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }
}

module.exports = CartController;
