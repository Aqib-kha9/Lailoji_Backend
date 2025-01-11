import Refund from "../models/RefundReq.js";
import Order from "../models/Order.js";
import { generateRefundId } from "../utils/generateRefundId.js"; // Ensure you have this utility function
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import { parse } from "json2csv";

export const createRefund = async (req, res) => {
  try {
    const { orderId, refundReason } = req.body;

    // Validate required fields
    if (!orderId || !refundReason?.description) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Find the order by ID
    const order = await Order.findById(orderId)
      .populate("customer", "firstName lastName email phoneNumber") // Customer details
      .populate("seller", "shopName email phone") // Seller details
      .populate("customerAddress", "street city postalCode") // Customer address
      .populate(
        "orderItems.productId",
        "productTitle productDescription pricing discountAmount"
      ); // Product details

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Check order eligibility for refund
    if (order.paymentStatus !== "Paid") {
      return res.status(400).json({
        success: false,
        message: "Refunds can only be requested for paid orders.",
      });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Refunds can only be requested for delivered orders.",
      });
    }

    // Prevent duplicate refund requests for the same product
    for (const item of order.orderItems) {
      const existingRefund = await Refund.findOne({
        "products.productId": item.productId,
        refundStatus: { $ne: "Completed" },
        orderId: orderId,
      });

      if (existingRefund) {
        return res.status(400).json({
          success: false,
          message: `Refund already requested for product: ${item.productId}`,
        });
      }
    }

    // Map order items to refund items
    const refundItems = order.orderItems.map((item) => ({
      productId: item.productId._id,
      title: item.productId.productTitle,
      description: item.productId.productDescription,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      tax: item.tax,
      itemDiscount: item.itemDiscount,
      totalPrice: item.quantity * item.unitPrice + item.tax - item.itemDiscount,
    }));

    // Calculate refundable amount
    const refundableAmount = refundItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    // Generate a unique refund ID
    const refundId = generateRefundId();

    // Create the refund object
    const refund = new Refund({
      refundId,
      paymentMethod: order.paymentMethod,
      orderId: order._id,
      products: refundItems,
      refundableAmount,
      refundReason: {
        description: refundReason.description,
        images: req.imageUrls, // Use uploaded image URLs from middleware
      },
      sellerId: order.seller._id,
      customerDetails: {
        name: `${order.customer.firstName} ${order.customer.lastName}`,
        email: order.customer.email,
        phone: order.customer.phoneNumber,
      },
      refundLogs: [
        {
          changedBy: order.customer._id,
          date: new Date(),
          status: "Pending",
          note: "Refund initiated by customer",
        },
      ],
    });

    // Save the refund
    await refund.save();

    // Respond with refund details
    res.status(201).json({
      success: true,
      message: "Refund request created successfully",
      refund: {
        refundId: refund.refundId,
        refundableAmount: refund.refundableAmount,
        refundReason: refund.refundReason,
        refundStatus: refund.refundStatus,
        customerDetails: refund.customerDetails,
        orderDetails: {
          orderId: refund.orderId,
          products: refund.products.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            price: item.unitPrice,
          })),
          totalPrice: order.total,
          paymentMethod: refund.paymentMethod,
        },
      },
    });
  } catch (error) {
    console.error("Error creating refund:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create refund" });
  }
};

export const getRefundsWithSearchAndStatus = async (req, res) => {
  try {
    // Extract refund status, search query, page number, and limit from the request
    const { refundStatus, search } = req.body;
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 records per page

    // Check if refundStatus is provided
    if (!refundStatus) {
      return res.status(400).json({ error: "Refund status is required" });
    }

    // Build the search query object
    const searchQuery = {};

    if (search) {
      // Use regex for string fields (refundId, customerDetails.name)
      searchQuery.$or = [];

      // Apply regex search for refundId and customerDetails.name (string fields)
      searchQuery.$or.push(
        { refundId: new RegExp(search, "i") }, // Case-insensitive search for refundId
        { "customerDetails.name": new RegExp(search, "i") } // Case-insensitive search for customer name
      );

      // If searching for orderId, handle it separately since it's an ObjectId
      if (mongoose.Types.ObjectId.isValid(search)) {
        searchQuery.orderId = mongoose.Types.ObjectId(search); // Convert search term to ObjectId if it's valid
      }
    }

    // Add refundStatus filter to the search query
    searchQuery.refundStatus = refundStatus;

    // Calculate the number of documents to skip for pagination
    const skip = (page - 1) * limit;

    // Query to find refunds based on the search query and refund status, with pagination
    const refunds = await Refund.find(searchQuery)
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip(skip) // Skip the previous pages' data
      .limit(limit) // Limit the results to the specified limit
      .populate("orderId", "orderId total paymentMethod") // Populate order details
      .populate(
        "products.productId",
        "productTitle productSKU productDescription images.productThumbnail"
      ) // Populate product details
      .populate("sellerId", "shopName email phone") // Populate seller details
      .populate("refundLogs.changedBy", "name email") // Populate user who changed refund status
      .exec();

    // If no refunds found for the given status and search query
    if (!refunds || refunds.length === 0) {
      return res.status(200).json({
        message: `No refunds found for the given status and search criteria.`,
        data: [], // Return an empty array instead of 404
        pagination: {
          currentPage: page,
          totalPages: 0, // No total pages if no results
          totalItems: 0, // No total items if no results
          pageSize: limit,
        },
        success: true,
      });
    }

    // Get the total count of documents matching the query (search and refundStatus)
    const totalCount = await Refund.countDocuments(searchQuery);

    // Return the paginated response
    res.status(200).json({
      message: `Refund requests fetched successfully`,
      data: refunds,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        pageSize: limit,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching refund requests:", error);
    res.status(500).json({
      error: "Failed to fetch refund requests",
      success: false,
    });
  }
};
export const exportRefunds = async (req, res) => {
  try {
    const { refundStatus, format } = req.query; // Extract refundStatus and format from query params

    if (!refundStatus) {
      return res.status(400).json({ error: "Refund status is required" });
    }

    if (!format || !["csv", "excel"].includes(format.toLowerCase())) {
      return res.status(400).json({ error: "Invalid format. Choose 'csv' or 'excel'" });
    }

    // Fetch all refund data with the specified refundStatus
    const refunds = await Refund.find({ refundStatus })
      .populate("orderId", "orderId total paymentMethod") // Populate relevant fields for order
      .populate(
        "products.productId",
        "productTitle productSKU productDescription images.productThumbnail"
      ) // Populate product fields
      .populate("sellerId", "shopName email phone") // Populate seller fields
      .populate({
        path: "refundLogs.changedBy", // Populate changedBy in refundLogs
        select: "firstName lastName email", // Select the fields to include in the response
      })
      .exec();

    if (refunds.length === 0) {
      return res.status(404).json({ error: "No refunds found for this status" });
    }

    // Generate a dynamic file name based on refundStatus
    const fileName = `refunds-${refundStatus.toLowerCase()}.${
      format.toLowerCase() === "excel" ? "xlsx" : "csv"
    }`;

    // Send the filename in a custom header
    res.setHeader("X-File-Name", fileName);

    if (format.toLowerCase() === "csv") {
      const csvData = parse(
        refunds.map((refund) => ({
          refundId: refund.refundId,
          orderId: refund.orderId.orderId,
          paymentMethod: refund.paymentMethod,
          refundStatus: refund.refundStatus,
          refundableAmount: refund.refundableAmount,
          refundReason: refund.refundReason?.description || "N/A",
          images:
            refund.refundReason.images &&
            Array.isArray(refund.refundReason.images)
              ? refund.refundReason.images.join("; ")
              : "N/A", // Ensure images is an array
          customerName: `${refund.customerDetails?.name || "N/A"}`,
          customerEmail: refund.customerDetails?.email || "N/A",
          customerPhone: refund.customerDetails?.phone || "N/A",
          refundRequestedDate: refund.refundRequestedDate,
          refundLogs: refund.refundLogs
            .map((log) => `${log?.changedBy?.firstName} (${log?.status})`)
            .join("; "),
          createdAt: refund.createdAt,
          updatedAt: refund.updatedAt,
        }))
      );

      // Set headers and send the CSV data
      res.header("Content-Type", "text/csv");
      res.attachment(fileName);
      return res.send(csvData);
    } else {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Refunds");

      worksheet.columns = [
        { header: "Refund ID", key: "refundId", width: 30 },
        { header: "Order ID", key: "orderId", width: 30 },
        { header: "Payment Method", key: "paymentMethod", width: 20 },
        { header: "Refund Status", key: "refundStatus", width: 20 },
        { header: "Refundable Amount", key: "refundableAmount", width: 20 },
        { header: "Refund Reason", key: "refundReason", width: 30 },
        { header: "Images", key: "images", width: 50 },
        { header: "Customer Name", key: "customerName", width: 30 },
        { header: "Customer Email", key: "customerEmail", width: 30 },
        { header: "Customer Phone", key: "customerPhone", width: 20 },
        {
          header: "Refund Requested Date",
          key: "refundRequestedDate",
          width: 30,
        },
        { header: "Refund Logs", key: "refundLogs", width: 50 },
        { header: "Created At", key: "createdAt", width: 30 },
        { header: "Updated At", key: "updatedAt", width: 30 },
      ];

      refunds.forEach((refund) => {
        worksheet.addRow({
          refundId: refund.refundId,
          orderId: refund.orderId.orderId,
          paymentMethod: refund.paymentMethod,
          refundStatus: refund.refundStatus,
          refundableAmount: refund.refundableAmount,
          refundReason: refund.refundReason?.description || "N/A",
          images:
            refund.refundReason.images &&
            Array.isArray(refund.refundReason.images)
              ? refund.refundReason.images.join("; ")
              : "N/A",
          customerName: `${refund.customerDetails?.name || "N/A"}`,
          customerEmail: refund.customerDetails?.email || "N/A",
          customerPhone: refund.customerDetails?.phone || "N/A",
          refundRequestedDate: refund.refundRequestedDate,
          refundLogs: refund.refundLogs
            .map((log) => `${log?.changedBy?.firstName} (${log?.status})`)
            .join("; "),
          createdAt: refund.createdAt,
          updatedAt: refund.updatedAt,
        });
      });

      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.attachment(fileName);
      return workbook.xlsx.write(res).then(() => res.end());
    }
  } catch (error) {
    console.error("Error exporting refunds:", error);
    res.status(500).json({ error: "Failed to export refunds", success: false });
  }
};


