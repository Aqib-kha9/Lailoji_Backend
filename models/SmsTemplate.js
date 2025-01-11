import mongoose from 'mongoose';

const smsTemplateSchema = new mongoose.Schema(
  {
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true, // Ensure the template name is always unique
    },
    template: {
      type: String,
      required: true,
    }, // The SMS content template (e.g., "Hello {{Name}}, your OTP is {{OTP}}")
    description: {
      type: String,
      required: true,
    }, // Description of the template
    variables: {
      type: [String],
      required: true,
    }, // List of variables used in the template (e.g., ["Name", "OTP"])
    isActive: {
      type: Boolean,
      default: true,
    }, // Whether the template is active
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const SmsTemplate = mongoose.model('SmsTemplate', smsTemplateSchema);

export default SmsTemplate;
