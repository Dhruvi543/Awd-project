import asyncHandler from '../utils/asyncHandler.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

/**
 * Get current Terms & Conditions
 * Public endpoint - no authentication required
 */
const getCurrentTerms = asyncHandler(async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    
    res.json({
      success: true,
      data: {
        content: settings.termsAndConditions,
        version: settings.termsVersion,
        lastUpdated: settings.termsLastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Terms & Conditions',
      error: error.message
    });
  }
});

/**
 * Accept Terms & Conditions
 * Doctor only - records acceptance with timestamp and version
 */
const acceptTerms = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get current T&C version
    const settings = await Setting.getSettings();
    const currentVersion = settings.termsVersion;
    
    // Update user's acceptance record
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Only doctors need to accept T&C
    if (user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors need to accept Terms & Conditions'
      });
    }
    
    user.termsAccepted = true;
    user.termsAcceptedAt = new Date();
    user.termsVersionAccepted = currentVersion;
    user.termsReacceptRequired = false;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Terms & Conditions accepted successfully',
      data: {
        acceptedAt: user.termsAcceptedAt,
        versionAccepted: user.termsVersionAccepted
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting Terms & Conditions',
      error: error.message
    });
  }
});

/**
 * Check Terms & Conditions status for logged-in doctor
 */
const getTermsStatus = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('role termsAccepted termsAcceptedAt termsVersionAccepted termsReacceptRequired');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get current T&C version
    const settings = await Setting.getSettings();
    const currentVersion = settings.termsVersion;
    
    // Check if re-acceptance is required
    const needsReacceptance = user.role === 'doctor' && (
      user.termsReacceptRequired || 
      !user.termsAccepted || 
      (user.termsVersionAccepted && user.termsVersionAccepted < currentVersion)
    );
    
    res.json({
      success: true,
      data: {
        role: user.role,
        termsAccepted: user.termsAccepted,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersionAccepted: user.termsVersionAccepted,
        currentTermsVersion: currentVersion,
        termsReacceptRequired: user.termsReacceptRequired,
        needsReacceptance: needsReacceptance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking Terms & Conditions status',
      error: error.message
    });
  }
});

/**
 * Update Terms & Conditions (Admin only)
 * Notifies all active doctors and requires re-acceptance
 */
const updateTerms = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Terms & Conditions content is required'
      });
    }
    
    // Get current settings
    const settings = await Setting.getSettings();
    
    // Increment version
    const newVersion = (settings.termsVersion || 1) + 1;
    
    // Update settings
    settings.termsAndConditions = content.trim();
    settings.termsVersion = newVersion;
    settings.termsLastUpdated = new Date();
    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    
    await settings.save();
    
    // Set re-acceptance required for all doctors
    await User.updateMany(
      { role: 'doctor', isDeleted: { $ne: true } },
      { 
        $set: { 
          termsReacceptRequired: true,
          termsAccepted: false
        } 
      }
    );
    
    // Create notifications for all active doctors
    const doctors = await User.find({ 
      role: 'doctor', 
      isDeleted: { $ne: true },
      isApproved: true
    }).select('_id');
    
    const notifications = doctors.map(doctor => ({
      user: doctor._id,
      type: 'terms_updated',
      message: `Our Terms & Conditions have been updated (Version ${newVersion}). Please review and accept the new terms on your next login.`,
      link: '/doctor/profile'
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    res.json({
      success: true,
      message: 'Terms & Conditions updated successfully. All doctors have been notified and must re-accept.',
      data: {
        version: newVersion,
        lastUpdated: settings.termsLastUpdated,
        doctorsNotified: notifications.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating Terms & Conditions',
      error: error.message
    });
  }
});

/**
 * Get current Privacy Policy
 * Public endpoint - no authentication required
 */
const getPrivacyPolicy = asyncHandler(async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    
    res.json({
      success: true,
      data: {
        content: settings.privacyPolicy,
        version: settings.privacyPolicyVersion,
        lastUpdated: settings.privacyPolicyLastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Privacy Policy',
      error: error.message
    });
  }
});

/**
 * Update Privacy Policy (Admin only)
 */
const updatePrivacyPolicy = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Privacy Policy content is required'
      });
    }
    
    // Get current settings
    const settings = await Setting.getSettings();
    
    // Increment version
    const newVersion = (settings.privacyPolicyVersion || 1) + 1;
    
    // Update settings
    settings.privacyPolicy = content.trim();
    settings.privacyPolicyVersion = newVersion;
    settings.privacyPolicyLastUpdated = new Date();
    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    
    await settings.save();
    
    res.json({
      success: true,
      message: 'Privacy Policy updated successfully.',
      data: {
        version: newVersion,
        lastUpdated: settings.privacyPolicyLastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating Privacy Policy',
      error: error.message
    });
  }
});

export {
  getCurrentTerms,
  acceptTerms,
  getTermsStatus,
  updateTerms,
  getPrivacyPolicy,
  updatePrivacyPolicy
};

