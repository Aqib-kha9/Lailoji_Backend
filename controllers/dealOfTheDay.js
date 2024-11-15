import DealOfTheDay from "../models/DealOfTheDay.js";
import Product from "../models/Product.js";
// Controller to create a new Deal of the Day
export const addDealOfTheDay = async (req, res) => {
  try {
    const { title, product, status = "Active" } = req.body; // Set default value if not provided
    console.log(req.body);
    // Validate request body
    if (!title || !product) {
      return res
        .status(400)
        .json({ message: "Title and products are required" });
    }

    // Create a new Deal of the Day instance
    const newDeal = new DealOfTheDay({
      title,
      product,
      status,
    });

    // Save the new deal to the database
    const savedDeal = await newDeal.save();

    res.status(201).json({
      message: "Deal of the Day added successfully",
      deal: savedDeal,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "An error occurred while adding the deal",
        error: error.message,
      });
  }
};

export const getAllDealOfTheDay = async (req, res) => {
  try {
    // Fetch all deals and populate the product details
    const deals = await DealOfTheDay.find()
      .populate("product")
      .sort({ createdAt: -1 });

    if (!deals) {
      return res.status(404).json({ message: "No deals found" });
    }

    // Send the populated deals as the response
    res.status(200).json({
      success: true,
      data: deals,
    });
  } catch (error) {
    console.error("Error fetching deals:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateDealStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedDeal = await DealOfTheDay.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.status(200).json({
      success: true,
      data: updatedDeal,
    });
  } catch (error) {
    console.error("Error updating deal status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateDealOfTheDay = async (req, res) => {
  try {
    const { id } = req.params; // Get the deal ID from the route parameters
    const { title, product, status } = req.body; // Get new values from the request body
    // Find the existing deal
    const existingDeal = await DealOfTheDay.findById(id);

    if (!existingDeal) {
      return res
        .status(404)
        .json({ success: false, message: "Deal not found" });
    }

    // Update fields only if provided in the request, otherwise retain existing values
    existingDeal.title = title !== undefined ? title : existingDeal.title;
    existingDeal.product =
      product !== undefined ? product : existingDeal.product;
    existingDeal.status = status !== undefined ? status : existingDeal.status;

    // Validate if the provided product ID exists (optional, but recommended)
    if (product) {
      const productExists = await Product.findById(product);
      if (!productExists) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid product ID" });
      }
    }

    // Save the updated deal to the database
    const updatedDeal = await existingDeal.save();

    res.status(200).json({
      success: true,
      message: "Deal of the Day updated successfully",
      data: updatedDeal,
    });
  } catch (error) {
    console.error("Error updating deal:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Controller to delete a "Deal of the Day"
export const deleteDealOfTheDay = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the deal exists
    const deal = await DealOfTheDay.findById(id);
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    // Delete the deal from the database
    await DealOfTheDay.findByIdAndDelete(id);

    res.status(200).json({ message: "Deal deleted successfully" });
  } catch (error) {
    console.error("Error deleting deal:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const getLeaveSummaryByEmployeeId = async (req, res) => {
  try {
    const userId = req.user._id; // Logged-in user's ID
    const employeeId = req.body.employeeId; // Employee ID passed if admin is fetching data for an employee

    const isUserAdmin = await isAdmin(userId);

    let leaveRecords;

    if (isUserAdmin) {
      if (employeeId) {
        leaveRecords = await LeaveManagement.find({ userId: employeeId });
      } else {
        leaveRecords = await LeaveManagement.find({ userId: userId });
      }
    } else {
      leaveRecords = await LeaveManagement.find({ userId: userId });
    }

    // Helper function to check if a date is a holiday or weekly holiday
    const isHolidayOrWeeklyHoliday = (dateStr) => {
      const date = new Date(dateStr.split('/').reverse().join('-')); // Convert to YYYY-MM-DD format
      return holidayDates.includes(dateStr) || weeklyHolidayDays.includes(date.toLocaleString('en-GB', { weekday: 'long' }));
    };

    // Continue the existing leave calculations logic ...

    let totalPaidLeave = 11;
    let totalCasualLeave = 5;
    let totalSickLeave = 6;
    let takenSickLeave = 0;
    let takenCasualLeave = 0;
    let takenUnpaidSickLeave = 0;
    let takenUnpaidCasualLeave = 0;
    let pendingPaidLeave = 0;
    let pendingUnpaidLeave = 0;

    leaveRecords.forEach((leave) => {
      const leaveStartDate = leave.startDate ? new Date(leave.startDate) : null;
      const leaveEndDate = leave.endDate ? new Date(leave.endDate) : null;
      const isHalfDay = leave.halfDay === true; // Assuming 'halfDay' is a boolean field

      // Handle multi-day leaves
      if (leaveStartDate && leaveEndDate) {
        const datesInRange = getDatesBetween(leave.startDate, leave.endDate);
        const validDates = datesInRange.filter(date => !isHolidayOrWeeklyHoliday(date));
        const leaveDays = isHalfDay ? 0.5 : 1;

        if (leave.status === 'Pending' && (leave.leaveType === 'Paid Sick' || leave.leaveType === 'Paid Casual')) {
          pendingPaidLeave += validDates.length;
        } else if (leave.status === 'Pending' && (leave.leaveType === 'Unpaid Sick' || leave.leaveType === 'Unpaid Casual')) {
          pendingUnpaidLeave += validDates.length;
        } else if (leave.status === 'Approved' && leave.leaveType === 'Paid Sick') {
          takenSickLeave += validDates.length;
        } else if (leave.status === 'Approved' && leave.leaveType === 'Paid Casual') {
          takenCasualLeave += validDates.length;
        } else if (leave.status === 'Approved' && leave.leaveType === 'Unpaid Sick') {
          takenUnpaidSickLeave += validDates.length;
        } else if (leave.status === 'Approved' && leave.leaveType === 'Unpaid Casual') {
          takenUnpaidCasualLeave += validDates.length;
        }
      }

      // Handle single-day leave records
      else if (leave.date) {
        const formattedDate = new Date(leave.date).toLocaleDateString('en-GB');

        if (!isHolidayOrWeeklyHoliday(formattedDate)) {
          if (leave.status === 'Pending' && (leave.leaveType === 'Paid Sick' || leave.leaveType === 'Paid Casual')) {
            pendingPaidLeave += 1;
          } else if (leave.status === 'Pending' && (leave.leaveType === 'Unpaid Sick' || leave.leaveType === 'Unpaid Casual')) {
            pendingUnpaidLeave += 1;
          } else if (leave.status === 'Approved' && leave.leaveType === 'Paid Sick') {
            takenSickLeave += 1;
          } else if (leave.status === 'Approved' && leave.leaveType === 'Paid Casual') {
            takenCasualLeave += 1;
          } else if (leave.status === 'Approved' && leave.leaveType === 'Unpaid Sick') {
            takenUnpaidSickLeave += 1;
          } else if (leave.status === 'Approved' && leave.leaveType === 'Unpaid Casual') {
            takenUnpaidCasualLeave += 1;
          }
        }
      }
    });

    let sickLeavesAvailable = totalSickLeave - takenSickLeave;
    let casualLeavesAvailable = totalCasualLeave - takenCasualLeave;
    let takenPaidLeave = takenSickLeave + takenCasualLeave;
    let paidLeaveAvailable = totalPaidLeave - takenPaidLeave;
    let unpaidLeave = takenUnpaidSickLeave + takenUnpaidCasualLeave;
    let totalPending = pendingPaidLeave + pendingUnpaidLeave;

    res.json({
      totalPaidLeave,
      totalCasualLeave,
      totalSickLeave,
      takenPaidLeave,
      takenCasualLeave,
      takenSickLeave,
      unpaidLeave,
      takenUnpaidSickLeave,
      takenUnpaidCasualLeave,
      pendingPaidLeave,
      pendingUnpaidLeave,
      totalPending,
      paidLeaveAvailable,
      sickLeavesAvailable,
      casualLeavesAvailable,
      leaveRecords // Only the relevant leave records for the logged-in user or their employee
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper function to check if the user is an admin
const isAdmin = async (userId) => {
  try {
    const user = await User.findById(userId); // Fetch user from database
    if (user && user.role === 'admin') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
