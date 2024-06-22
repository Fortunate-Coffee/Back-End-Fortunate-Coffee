const ApplicationController = require('./ApplicationController');
const { Op } = require('sequelize');

class FoodIngredientsController extends ApplicationController {
  constructor({ foodIngredientsModel, detailFoodIngredientsModel }) {
    super();
    this.foodIngredientsModel = foodIngredientsModel;
    this.detailFoodIngredientsModel = detailFoodIngredientsModel;
  }

  handleCreateFoodIngredients = async (req, res) => {
    try {
      const {
        food_ingredients_id,
        food_ingredients_name,
        food_ingredients_stock
      } = req.body;

      if (food_ingredients_stock <= 1) {
        return res.status(422).json({
          error: {
            message: "Stock tidak boleh kurang dari 1"
          }
        });
      }

      const foodIngredients = await this.foodIngredientsModel.create({
        food_ingredients_id,
        food_ingredients_name,
        food_ingredients_stock
      });

      res.status(201).json(foodIngredients);
    } catch (error) {
      res.status(422).json({
        error: {
          name: error.name,
          message: error.message
        }
      })
    }
  }

  handleGetFoodIngredients = async (req, res) => {
    try {
      const foodIngredients = await this.getFoodIngredientsFromRequest(req);
      const alert = foodIngredients.food_ingredients_stock <= 5
        ? `Stock for ${foodIngredients.food_ingredients_name} is running low.`
        : null;

      const response = { ...foodIngredients.toJSON(), alert }; // Menambahkan alert ke dalam objek foodIngredients
      res.status(200).json(response);
    } catch (error) {
      res.status(404).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  handleUpdateFoodIngredients = async (req, res) => {
    try {
      const {
        food_ingredients_id,
        food_ingredients_name,
        food_ingredients_stock
      } = req.body;

      if (food_ingredients_stock <= 1) {
        return res.status(422).json({
          error: {
            message: "Stock tidak boleh kurang dari 1"
          }
        });
      }

      const foodIngredients = await this.getFoodIngredientsFromRequest(req);

      await foodIngredients.update({
        food_ingredients_id,
        food_ingredients_name,
        food_ingredients_stock
      });

      res.status(200).json(foodIngredients);
    } catch (err) {
      res.status(422).json({
        error: {
          name: err.name,
          message: err.message,
        }
      });
    }
  }

  handleDeleteFoodIngredients = async (req, res) => {
    const foodIngredients = await this.getFoodIngredientsFromRequest(req);
    await foodIngredients.destroy();
    res.status(204).json(foodIngredients).end();
  }

  handleListFoodIngredients = async (req, res) => {
    try {
      const foodIngredients = await this.foodIngredientsModel.findAll();

      const response = foodIngredients.map(fi => {
        const alert = fi.food_ingredients_stock <= 5
          ? `Stock for ${fi.food_ingredients_name} is running low.`
          : null;
        return { ...fi.toJSON(), alert }; // Menambahkan alert ke dalam objek foodIngredients
      });

      res.status(200).json(response);
    } catch (error) {
      res.status(404).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  handleGetFilteredFoodIngredients = async (req, res) => {
    try {
      const { food_ingredients_id, type, period } = req.query;
      
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

      let filter = {};

      if (type === 'Remaining Stock') {
        // Ignore date filter for Remaining Stock
        filter = { where: {} };
      } else {
        filter = {
          where: {
            ...(Object.keys(dateFilter).length > 0 && { updatedAt: dateFilter })
          }
        };
      }

      if (food_ingredients_id && food_ingredients_id !== 'All') {
        filter.where.food_ingredients_id = food_ingredients_id;
      }

      if (type === 'Remaining Stock') {
        const foodIngredients = await this.foodIngredientsModel.findAll(filter);
        res.status(200).json(foodIngredients);
      } 
      else {
        filter.where.detail_food_ingredients_type = type;
        const detailFoodIngredients = await this.detailFoodIngredientsModel.findAll(filter);
        res.status(200).json(detailFoodIngredients);
      }
      
    } catch (error) {
      res.status(404).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  getFoodIngredientsFromRequest(req) {
    return this.foodIngredientsModel.findByPk(req.params.id);
  }
}

module.exports = FoodIngredientsController;