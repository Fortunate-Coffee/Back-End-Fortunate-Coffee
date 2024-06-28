const ApplicationController = require('./ApplicationController');
const imagekit = require('../lib/imageKitConfig');
const { Op } = require('sequelize');

class MenuController extends ApplicationController {
  constructor({ categoryModel, menuModel, foodIngredientsModel, menuIngredientsModel }) {
    super();
    this.categoryModel = categoryModel;
    this.menuModel = menuModel;
    this.foodIngredientsModel = foodIngredientsModel;
    this.menuIngredientsModel = menuIngredientsModel;
  }

  handleCreateMenu = async (req, res) => {
    try {
      const {
        category_id,
        menu_name,
        menu_price,
        menu_image,
        menu_desc
      } = req.body;
      let imageUrl = menu_image;

      const categoryId = await this.categoryModel.findOne({
        where: { category_id: category_id }
      });

      if (!categoryId) {
        return res.status(404).json({ error: { message: "Category not found." } });
      }

      if (req.file) {
        const imageName = req.file.originalname;
        const img = await imagekit.upload({
          file: req.file.buffer,
          fileName: imageName,
          folder: "/Fortunate_Coffee/Menu"
        });
        imageUrl = img.url;
      }

      const menu = await this.menuModel.create({
        category_id,
        menu_name,
        menu_price,
        menu_image: imageUrl,
        menu_desc
      });

      res.status(201).json({
        status: 'success',
        message: 'Menu created successfully',
        data: menu
      });
    } catch (error) {
      res.status(422).json({
        error: {
          name: error.name,
          message: error.message
        }
      })
    }
  }

  handleGetMenu = async (req, res) => {
    try {
      const menu = await this.getMenuFromRequest(req);

      if (!menu) {
        return res.status(404).json({ error: { message: 'Menu not found' } });
      }

      const { isOutOfStock, stockWarnings, OutOfStock, maxStockCanBeMade } = await this.checkMenuStock(menu);

      res.status(200).json({
        ...menu.toJSON(),
        isOutOfStock,
        stockWarnings,
        OutOfStock,
        maxStockCanBeMade
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

  handleUpdateMenu = async (req, res) => {
    try {
      const {
        category_id,
        menu_name,
        menu_price,
        menu_image,
        menu_desc
      } = req.body;

      const categoryId = await this.categoryModel.findOne({
        where: { category_id: category_id }
      });

      if (!categoryId) {
        return res.status(404).json({ error: { message: "Category not found." } });
      }

      const menu = await this.getMenuFromRequest(req);

      if (req.file) {
        const imageName = req.file.originalname;
        const img = await imagekit.upload({
          file: req.file.buffer,
          fileName: imageName,
          folder: "/Fortunate_Coffee/Menu"
        });
        await menu.update({
          category_id,
          menu_name,
          menu_price,
          menu_image: img.url,
          menu_desc
        });
        return res.status(200).json({
          status: 'success',
          message: 'Menu updated successfully',
          data: {
            category_id,
            menu_name,
            menu_price,
            menu_image: img.url,
            menu_desc
          }
        });
      } else if (menu_image.startsWith('http')) {
        // Handling case where menu_image is a URL
        await menu.update({
          category_id,
          menu_name,
          menu_price,
          menu_image,
          menu_desc
        });

        return res.status(200).json({
          status: 'success',
          message: 'Menu updated successfully',
          data: {
            category_id,
            menu_name,
            menu_price,
            menu_image,
            menu_desc
          }
        });
      } else {
        // Handling case where menu_image is neither a URL nor a file upload
        await menu.update({
          category_id,
          menu_name,
          menu_price,
          menu_desc
        });

        return res.status(200).json({
          status: 'success',
          message: 'Menu updated successfully',
          data: {
            category_id,
            menu_name,
            menu_price,
            menu_image: menu.menu_image, // Assuming you want to return existing image if no update
            menu_desc
          }
        });
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

  handleDeleteMenu = async (req, res) => {
    const menu = await this.getMenuFromRequest(req);
    await menu.destroy();
    res.status(204).json(menu).end();
  }

  handleListMenu = async (req, res) => {
    try {
      const menus = await this.menuModel.findAll({
        include: this.categoryModel
      });

      const menuStatuses = await Promise.all(menus.map(async (menu) => {
        const { isOutOfStock, stockWarnings, OutOfStock, maxStockCanBeMade } = await this.checkMenuStock(menu);
        return {
          ...menu.toJSON(),
          isOutOfStock,
          stockWarnings,
          OutOfStock,
          maxStockCanBeMade
        };
      }));

      res.status(200).json(menuStatuses);
    } catch (error) {
      res.status(500).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  handleGetMenuByCategoryId = async (req, res) => {
    try {
      const { id } = req.params;
      const menus = await this.menuModel.findAll({
        where: { category_id: id },
        include: this.categoryModel
      });

      if (menus.length === 0) {
        return res.status(404).json({ error: 'No menus found for this category' });
      }

      const menuStatuses = await Promise.all(menus.map(async (menu) => {
        const { isOutOfStock, stockWarnings, OutOfStock, maxStockCanBeMade } = await this.checkMenuStock(menu);
        return {
          ...menu.toJSON(),
          isOutOfStock,
          stockWarnings,
          OutOfStock,
          maxStockCanBeMade
        };
      }));

      res.status(200).json(menuStatuses);
    } catch (error) {
      console.error('Error getting menus by category ID:', error);
      res.status(500).json({ error: error.message });
    }
  }

  handleSearch = async (req, res) => {
    try {
      const { query } = req.query;
      console.log(`Received search query: ${query}`);
  
      // Check for menu
      const menu = await this.menuModel.findOne({
        where: { menu_name: { [Op.like]: `%${query}%` } },
        include: this.categoryModel
      });
  
      if (menu) {
        console.log('Menu found:', menu);

        // Fetch the category details by ID
        const category = await this.categoryModel.findByPk(menu.category_id);

        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }

        return res.status(200).json({
          type: 'menu',
          data: {
            menu: menu,
            category: category
          }
        });
      }
  
      console.log('No results found for query:', query);
      return res.status(404).json({ error: 'No results found' });
    } catch (error) {
      console.error('Error during search:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  checkMenuStock = async (menu) => {
    const menuIngredients = await this.menuIngredientsModel.findAll({
      where: { menu_id: menu.menu_id },
      include: [{
        model: this.foodIngredientsModel,
        as: 'food_ingredients'
      }]
    });
  
    console.log('menu ingredients with food ingredients:', JSON.stringify(menuIngredients, null, 2));
  
    let isOutOfStock = false;
    const stockWarnings = [];
    const OutOfStock = [];
    let maxStockCanBeMade = Infinity; // Inisialisasi maksimum stock yang dapat dibuat
  
    for (const ingredient of menuIngredients) {
      const requiredQuantity = ingredient.menu_ingredients_qty;
  
      // Ensure the food_ingredients is correctly referenced
      const foodIngredient = ingredient.food_ingredients[0]; // Assuming food_ingredients is an array
  
      if (!foodIngredient) {
        console.error(`No food ingredient found for menu ingredient with ID: ${ingredient.menu_ingredients_id}`);
        continue;
      }
  
      const stock = foodIngredient.food_ingredients_stock;
  
      console.log(`stock for ingredient ${foodIngredient.food_ingredients_name}: `, stock);
      console.log(`required quantity for ingredient ${foodIngredient.food_ingredients_name}: `, requiredQuantity);

      // Hitung maksimum stock yang dapat dibuat berdasarkan ketersediaan bahan makanan
      const maxStockPossible = Math.floor(stock / requiredQuantity);
      if (maxStockPossible < maxStockCanBeMade) {
        maxStockCanBeMade = maxStockPossible;
      }
  
      if (stock < requiredQuantity) {
        isOutOfStock = true; // Menu is out of stock
        OutOfStock.push(`${foodIngredient.food_ingredients_name} out of stock`);
      } else if (stock - requiredQuantity < 5) {
        stockWarnings.push(`${foodIngredient.food_ingredients_name} stock is low`);
      }
    }
  
    return { isOutOfStock, OutOfStock, stockWarnings, maxStockCanBeMade };
  }
  
  getMenuFromRequest(req) {
    return this.menuModel.findByPk(req.params.id);
  }
}

module.exports = MenuController;