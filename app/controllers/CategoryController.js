const ApplicationController = require('./ApplicationController');
const imagekit = require('../lib/imageKitConfig');

class CategoryController extends ApplicationController {
  constructor({ categoryModel, menuModel }) {
    super();
    this.categoryModel = categoryModel;
    this.menuModel = menuModel;
  }

  handleCreateCategory = async (req, res) => {
    try {
      const { category_name, category_image } = req.body;
      let imageUrl = category_image;

      if (req.file) {
        const imageName = req.file.originalname;
        const img = await imagekit.upload({
          file: req.file.buffer,
          fileName: imageName,
          folder: "/Fortunate_Coffee/Category"
        });
        imageUrl = img.url;
      }

      const category = await this.categoryModel.create({
        category_name,
        category_image: imageUrl
      });

      res.status(201).json({
        status: 'success',
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      res.status(422).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  handleGetCategory = async (req, res) => {
    const category = await this.getCategoryFromRequest(req);

    res.status(200).json(category);
  }

  handleUpdateCategory = async (req, res) => {
    try {
      const { category_name, category_image } = req.body;
      const category = await this.getCategoryFromRequest(req);

      if (req.file) {
        const imageName = req.file.originalname;
        const img = await imagekit.upload({
          file: req.file.buffer,
          fileName: imageName,
          folder: "/Fortunate_Coffee/Category"
        });

        await category.update({
          category_name,
          category_image: img.url,
        });

        res.status(200).json({
          status: 'success',
          message: 'Category updated successfully',
          data: {
            category_name,
            category_image: img.url,
          }
        });
      } else if (category_image.startsWith('http')) {
        // Handling case where category_image is a URL
        await category.update({
          category_name,
          category_image,
        });

        res.status(200).json({
          status: 'success',
          message: 'Category updated successfully',
          data: {
            category_name,
            category_image,
          }
        });
      } else {
        // Handling case where category_image is not a URL nor a file upload
        await category.update({
          category_name,
        });

        res.status(200).json({
          status: 'success',
          message: 'Category updated successfully',
          data: {
            category_name,
            category_image: category.category_image, // Assuming you want to return existing image if no update
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

  handleDeleteCategory = async (req, res) => {
    try {
      const category = await this.getCategoryFromRequest(req);

      // Check if there are any menus associated with this category
      const menus = await this.menuModel.findAll({
        where: { category_id: category.category_id }
      });

      if (menus.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete category because it has associated menus.'
        });
      }

      await category.destroy();
      res.status(204).json({
        status: 'success',
        message: 'Category deleted successfully'
      }).end();
    } catch (err) {
      res.status(422).json({
        error: {
          name: err.name,
          message: err.message,
        }
      });
    }
  }

  handleListCategory = async (req, res) => {
    const category = await this.categoryModel.findAll()

    res.status(200).json(category)
  }

  handleListCategoryInUse = async (req, res) => {
    try {
      // Fetch category IDs that are used in the menu
      const usedCategories = await this.menuModel.findAll({
        attributes: ['category_id'],
        group: ['category_id']
      });

      // Extract the unique category IDs
      const usedCategoryIds = usedCategories.map(item => item.category_id);

      if (usedCategoryIds.length === 0) {
        return res.status(200).json([]);
      }

      // Retrieve the categories that are still in use
      const categoriesInUse = await this.categoryModel.findAll({
        where: {
          category_id: usedCategoryIds
        }
      });

      res.status(200).json(categoriesInUse);
    } catch (error) {
      res.status(422).json({
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  getCategoryFromRequest(req) {
    return this.categoryModel.findByPk(req.params.id);
  }
}

module.exports = CategoryController;