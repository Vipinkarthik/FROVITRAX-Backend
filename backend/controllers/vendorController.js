import VendorDetails from "../models/VendorDetails.js";
import VendorProduct from "../models/VendorProduct.js";
import Order from "../models/Order.js";
// Get logged-in vendor details
export const getLoggedInVendor = async (req, res) => {
  try {
    console.log('getLoggedInVendor: req.user.id =', req.user.id);
    let vendorDetails = await VendorDetails.findOne({ user: req.user.id }) || await VendorDetails.findOne({ user: req.user.id.toString() });
    if (!vendorDetails) {
      console.log('No VendorDetails found for user:', req.user.id);
      return res.status(404).json({ message: 'Vendor not found', userId: req.user.id });
    }

    res.status(200).json({
      fullName: vendorDetails.ownerName,
      email: vendorDetails.contact?.email || '',
      phone: vendorDetails.contact?.phone || '',
      company: vendorDetails.businessName,
      businessType: vendorDetails.businessType,
      address: vendorDetails.address,
      userId: vendorDetails.user,
      _id: vendorDetails._id,
      supplyCategories: vendorDetails.supplyCategories,
      operationalArea: vendorDetails.operationalArea,
      licenseNumber: vendorDetails.licenseNumber,
      years: vendorDetails.years,
      avgCapacity: vendorDetails.avgCapacity,
      // Add more fields if needed for frontend
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vendor', error: error.message });
  }
};
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await VendorDetails.find().populate('user', 'name email');
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Failed to fetch vendors', error: error.message });
  }
};

export const saveVendorDetails = async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      businessType,
      contact,
      address,
      supplyCategories,
      operationalArea,
      licenseNumber,
      years,
      avgCapacity
    } = req.body;

    if (
      !businessName || !ownerName || !businessType || !contact || !address ||
      !supplyCategories.length || !operationalArea || !licenseNumber || !years || !avgCapacity
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const vendorData = await VendorDetails.create({
      businessName,
      ownerName,
      businessType,
      contact,
      address,
      supplyCategories,
      operationalArea,
      licenseNumber,
      years,
      avgCapacity,
      user: req.user.id
    });

    res.status(201).json({ message: 'Vendor details saved', data: vendorData });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save vendor details', error: err.message });
  }
};

// Get vendor's products
export const getVendorProducts = async (req, res) => {
  try {
    const vendorDetails = await VendorDetails.findOne({ user: req.user.id });
    if (!vendorDetails) {
      return res.status(404).json({ message: 'Vendor details not found' });
    }

    const products = await VendorProduct.find({ vendor: vendorDetails._id })
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

// Add new product
export const addVendorProduct = async (req, res) => {
  try {
    const vendorDetails = await VendorDetails.findOne({ user: req.user.id });
    if (!vendorDetails) {
      return res.status(404).json({ message: 'Vendor details not found' });
    }

    const {
      productName,
      category,
      description,
      quantity,
      unit,
      pricePerUnit,
      minOrderQuantity,
      maxOrderQuantity,
      harvestDate,
      expiryDate,
      qualityCertifications,
      location,
      deliveryOptions
    } = req.body;

    const newProduct = new VendorProduct({
      productName,
      category,
      description,
      quantity,
      unit,
      pricePerUnit,
      minOrderQuantity,
      maxOrderQuantity,
      vendor: vendorDetails._id,
      vendorName: vendorDetails.ownerName,
      vendorCompanyName: vendorDetails.businessName,
      harvestDate,
      expiryDate,
      qualityCertifications,
      location: location || vendorDetails.operationalArea,
      deliveryOptions
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Failed to add product', error: error.message });
  }
};

// Update product
export const updateVendorProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorDetails = await VendorDetails.findOne({ user: req.user.id });

    if (!vendorDetails) {
      return res.status(404).json({ message: 'Vendor details not found' });
    }

    const product = await VendorProduct.findOne({ _id: id, vendor: vendorDetails._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    const updatedProduct = await VendorProduct.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

// Delete product
export const deleteVendorProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorDetails = await VendorDetails.findOne({ user: req.user.id });

    if (!vendorDetails) {
      return res.status(404).json({ message: 'Vendor details not found' });
    }

    const product = await VendorProduct.findOne({ _id: id, vendor: vendorDetails._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    await VendorProduct.findByIdAndDelete(id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

// Get orders for vendor
export const getVendorOrders = async (req, res) => {
  try {
    const vendorDetails = await VendorDetails.findOne({ user: req.user.id });
    if (!vendorDetails) {
      return res.status(404).json({ message: 'Vendor details not found' });
    }

    const orders = await Order.find({ vendor: vendorDetails._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};
