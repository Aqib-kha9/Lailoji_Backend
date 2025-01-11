import SmsTemplate from '../models/SmsTemplate.js';

export const createSmsTemplate = async (req, res) => {
  try {
    const { name, template, description, variables, isActive } = req.body;

    // Validate required fields
    if (!name || !template || !description || !variables) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if variables in the template match provided variables
    const templateVariables = template.match(/{{\w+}}/g)?.map((v) => v.replace(/[{}]/g, '')) || [];
    const missingVariables = templateVariables.filter((v) => !variables.includes(v));

    if (missingVariables.length > 0) {
      return res.status(400).json({
        message: `Template contains unrecognized variables: ${missingVariables.join(', ')}`,
      });
    }

    // Create and save the SMS Template
    const newSmsTemplate = new SmsTemplate({
      name,
      template,
      description,
      variables,
      isActive: isActive !== undefined ? isActive : true,
    });

    await newSmsTemplate.save();

    return res.status(201).json({
      message: 'SMS Template created successfully!',
      data: newSmsTemplate,
    });
  } catch (error) {
    console.error('Error creating SMS Template:', error.message);

    // Handle unique key error for 'name'
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Template name must be unique.' });
    }

    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

