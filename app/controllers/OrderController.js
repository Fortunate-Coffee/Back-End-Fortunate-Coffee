const { Op } = require('sequelize');
const { scheduleJob, cancelJob } = require('node-schedule');
const ApplicationController = require('./ApplicationController');

class OrderController extends ApplicationController {
  constructor({ userModel, orderModel, detailOrderModel, menuIngredientsModel, foodIngredientsModel, detailFoodIngredientsModel }) {
    super();
    this.userModel = userModel;
    this.orderModel = orderModel;
    this.detailOrderModel = detailOrderModel;
    this.menuIngredientsModel = menuIngredientsModel;
    this.foodIngredientsModel = foodIngredientsModel;
    this.detailFoodIngredientsModel = detailFoodIngredientsModel;
    this.scheduleJob = null;
    // Bind the deleteScheduledOrders method
    // Schedule job to delete orders with status 0 after 15 minutes
    scheduleJob('*/1 * * * *', () => this.handleDeleteScheduledOrder());
  }

  handleCreateOrder = async (req, res) => {
    try {
      const {
        cust_name,
        table_number,
        order_status,
        price_total,
        user_acc_id
      } = req.body;

      const userAcc = await this.userModel.findOne({
        where: { user_acc_id: user_acc_id }
      });

      if(!userAcc) {
        return res.status(400).json({ error: { message: "User not found." } });
      }

      const order = await this.orderModel.create({
        cust_name,
        table_number,
        order_status,
        price_total,
        user_acc_id
      });

      res.status(201).json(order);
    } catch (error) {
      res.status(422).json({
        error: {
          name: error.name,
          message: error.message
        }
      })
    }
  }

  handleGetOrder = async (req, res) => {
    const order = await this.getOrderFromRequest(req);

    res.status(200).json(order);
  }

  handleUpdateOrder = async (req, res) => {
    try {
      const {
        order_status
      } = req.body;
  
      const order = await this.getOrderFromRequest(req);
  
      if (order.order_status == 1) {
        return res.status(400).json({ error: { message: "Order has already been completed." } });
      }
  
      // Mengecek jika status yang akan diupdate adalah dari 0 ke 1
      if (order_status === 1) {
        await order.update({ order_status });
        res.status(200).json(order);
      } else {
        return res.status(400).json({ error: { message: "Invalid status update." } });
      }
  
    } catch (err) {
      res.status(422).json({
        error: {
          name: err.name,
          message: err.message,
        }
      });
    }
  }

  handleDeleteScheduledOrder = async () => {
    const transaction = await this.orderModel.sequelize.transaction();
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const ordersToDelete = await this.orderModel.findAll({
        where: { order_status: '0', createdAt: { [Op.lt]: fifteenMinutesAgo } }
      });
  
      if (ordersToDelete.length > 0) {
        for (const order of ordersToDelete) {
          const detailOrders = await this.detailOrderModel.findAll({
            where: { order_id: order.order_id },
            transaction
          });
  
          const processedIngredients = new Set();
  
          for (const detailOrder of detailOrders) {
            const menuIngredients = await this.menuIngredientsModel.findAll({
              where: { menu_id: detailOrder.menu_id },
              transaction
            });
  
            for (const menuIngredient of menuIngredients) {
              const ingredientKey = `${menuIngredient.food_ingredients_id}-${detailOrder.detail_order_qty}`;
  
              if (!processedIngredients.has(ingredientKey)) {
                const incrementQty = menuIngredient.menu_ingredients_qty * detailOrder.detail_order_qty;
  
                console.log(`Incrementing ${incrementQty} for ingredient ID ${menuIngredient.food_ingredients_id}`);
  
                await this.foodIngredientsModel.increment('food_ingredients_stock', {
                  by: incrementQty,
                  where: { food_ingredients_id: menuIngredient.food_ingredients_id },
                  transaction
                });
  
                await this.detailFoodIngredientsModel.destroy({
                  where: {
                    food_ingredients_id: menuIngredient.food_ingredients_id,
                    detail_food_ingredients_qty: incrementQty,
                    detail_food_ingredients_type: 'Out'
                  },
                  transaction
                });
  
                processedIngredients.add(ingredientKey);
              }
            }
  
            await detailOrder.destroy({ transaction });
          }
  
          await order.destroy({ transaction });
          console.log(`Order with ID ${order.order_id} and its details have been deleted.`);
        }
  
        await transaction.commit();
        this.lastScheduledDeleteStatus = { success: true, message: "Scheduled orders deleted successfully." };
      } else {
        await transaction.rollback();
        this.lastScheduledDeleteStatus = { success: false, message: "No orders found to delete." };
      }
    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting scheduled orders:", error);
      this.lastScheduledDeleteStatus = { success: false, message: "Internal server error." };
    }
  };  
  
  handleListOrder = async (req, res) => {
    const order = await this.orderModel.findAll()

    res.status(200).json(order)
  }

  handleGetFilteredOrder = async (req, res) => {
    try {
      const { order_id, table_number, period } = req.query;
      
      let dateFilter = {};
      const today = new Date();
      switch (period) {
        case 'All':
          dateFilter = {}; // No date filter
          break;
        case 'Today':
          dateFilter = { [Op.gte]: today.setHours(0, 0, 0, 0) };
          break;
        case 'Last 7 days':
          dateFilter = { [Op.gte]: new Date(today - 7 * 24 * 60 * 60 * 1000) };
          break;
        case 'Last 30 days':
          dateFilter = { [Op.gte]: new Date(today - 30 * 24 * 60 * 60 * 1000) };
          break;
        case 'Last 3 months':
          dateFilter = { [Op.gte]: new Date(today - 3 * 30 * 24 * 60 * 60 * 1000) };
          break;
        default:
          break;
      }

      let filter = {
        where: {}
      };
  
      if (period !== 'All') {
        filter.where.updatedAt = dateFilter;
      }

      if (order_id) {
        filter.where.order_id = order_id;
      }

      if (table_number && table_number !== 'All') {
        filter.where.table_number = table_number;
      }

      const orders = await this.orderModel.findAll(filter);
      res.status(200).json(orders);
    } catch (error) {
      res.status(404).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  getOrderFromRequest = async (req) => {
    return this.orderModel.findByPk(req.params.id);
  }
}

module.exports = OrderController;