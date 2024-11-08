import WithdrawalMethod from "../models/WithdrawalMeth.js";
import mongoose from "mongoose";
export const addWithdrawalMethod = async (req, res) => {
  const { methodName, fields, isActive, isDefault } = req.body;
    console.log(req.body);
  try {
    // Check if methodName already exists
    const existingMethod = await WithdrawalMethod.findOne({ methodName });
    if (existingMethod) {
      return res.status(400).json({ message: "Method name already exists." });
    }

    // Create a new withdrawal method
    const newMethod = new WithdrawalMethod({
      methodName,
      fields,
      isActive: isActive ?? true, // default to true if not provided
      isDefault: isDefault ?? false, // default to false if not provided
    });

    // Save the new method, triggering pre-save hook to handle default method
    await newMethod.save();

    res.status(201).json({
      message: "Withdrawal method added successfully.",
      method: newMethod,
    });
  } catch (error) {
    console.error("Error adding withdrawal method:", error);
    res.status(500).json({ message: "Server error while adding method." });
  }
};

// Controller to get all withdrawal methods
export const getAllWithdrawalMethods = async (req, res) => {
    try {
      // Find all withdrawal methods
      const methods = await WithdrawalMethod.find().sort({createdAt:-1});
  
      // Return the methods as a response
      res.status(200).json({ methods });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to retrieve withdrawal methods" });
    }
  };

 // Controller function to update or edit a withdrawal method
export const updateWithdrawalMethod = async (req, res) => {
    const { methodId } = req.params;
    
    // Log the methodId to check if it's received correctly
    console.log('Method ID:', methodId);
  
    // Validate if the methodId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(methodId)) {
      return res.status(400).json({ message: "Invalid method ID" });
    }
  
    // Destructure the necessary fields from the request body
    const { methodName, fields, isActive, isDefault } = req.body;
  
    // Validate the input fields (you can add more validation as needed)
    if (!methodName || !fields || fields.length === 0) {
      return res.status(400).json({ message: "Method name and fields are required" });
    }
  
    try {
      // Find the withdrawal method by its ID
      const withdrawalMethod = await WithdrawalMethod.findById(methodId);
  
      // If the method is not found, return a 404 error
      if (!withdrawalMethod) {
        return res.status(404).json({ message: "Withdrawal method not found" });
      }
  
      // Update the withdrawal method with new values
      withdrawalMethod.methodName = methodName;
      withdrawalMethod.fields = fields;
      withdrawalMethod.isActive = isActive;
      withdrawalMethod.isDefault = isDefault;
  
      // Save the updated method
      const updatedMethod = await withdrawalMethod.save();
  
      // Return a success response with the updated method
      return res.status(200).json({ message: "Withdrawal method updated successfully", updatedMethod });
    } catch (error) {
      // Log any errors for debugging
      console.error(error);
      
      // Return a 500 server error if something goes wrong
      return res.status(500).json({ message: "Failed to update withdrawal method" });
    }
  };

// Update Withdrawal Method status (isActive or isDefault)
export const updateWithdrawalMethodStatus = async (req, res) => {
    try {
      const methodId = req.params.id; // Get the method ID from the URL params
      const { field } = req.body;  // The field that needs to be updated (either 'isActive' or 'isDefault')
  
      // Validate the method ID
      if (!mongoose.Types.ObjectId.isValid(methodId)) {
        return res.status(400).json({ message: 'Invalid method ID' });
      }
  
      // Validate the field parameter
      if (!field || (field !== 'isActive' && field !== 'isDefault')) {
        return res.status(400).json({ message: 'Invalid field specified' });
      }
  
      // Find the method by its ID
      const method = await WithdrawalMethod.findById(methodId);
      if (!method) {
        return res.status(404).json({ message: 'Withdrawal method not found' });
      }
  
      // If the field being updated is 'isDefault'
      if (field === 'isDefault') {
        // Check if the method is being set as the default
        if (method.isDefault) {
          // If it's already the default, no action is needed
          return res.status(200).json(method);
        }
  
        // If setting a method as default, first set all other methods' 'isDefault' to false
        await WithdrawalMethod.updateMany({ isDefault: true }, { $set: { isDefault: false } });
  
        // Set the selected method as the default
        method.isDefault = true;
      } else {
        // If the field is 'isActive', toggle the field value
        method[field] = !method[field];
      }
  
      // Save the updated method
      const updatedMethod = await method.save();
  
      // Return the updated method
      return res.status(200).json(updatedMethod);
  
    } catch (error) {
      console.error('Error updating withdrawal method:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  
  // Delete a Withdrawal Method by ID
export const deleteWithdrawalMethod = async (req, res) => {
    try {
      const methodId = req.params.id; // Get the method ID from the URL params
  
      // Validate the method ID
      if (!mongoose.Types.ObjectId.isValid(methodId)) {
        return res.status(400).json({ message: 'Invalid method ID' });
      }
  
      // Find and delete the method by its ID
      const deletedMethod = await WithdrawalMethod.findByIdAndDelete(methodId);
  
      // Check if the method was found and deleted
      if (!deletedMethod) {
        return res.status(404).json({ message: 'Withdrawal method not found' });
      }
  
      // Respond with a success message
      return res.status(200).json({ message: 'Withdrawal method deleted successfully' });
  
    } catch (error) {
      console.error('Error deleting withdrawal method:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  
  
