/**
 * WildDuck API Helper Functions
 * Comprehensive utilities for managing WildDuck email server settings
 */

// User Settings
export {
  getUserInfo,
  updateUserName,
  updateUserSettings,
  UserInfo,
  WildDuckConfig,
} from './user-settings';

// Forwarding
export {
  getForwardingTargets,
  updateForwardingTargets,
  addForwardingTarget,
  removeForwardingTarget,
  ForwardingTarget,
  ForwardingTargetsResponse,
} from './forwarding';

// Spam Settings
export {
  getSpamSettings,
  updateSpamLevel,
  updateFromWhitelist,
  addToFromWhitelist,
  removeFromWhitelist,
  updateSpamSettings,
  SpamSettings,
} from './spam-settings';

// Auto-Reply
export {
  getAutoReply,
  updateAutoReply,
  enableAutoReply,
  disableAutoReply,
  deleteAutoReply,
  AutoReplySettings,
  UpdateAutoReplyParams,
} from './autoreply';

// Filters
export {
  getFilters,
  getFilter,
  createFilter,
  updateFilter,
  deleteFilter,
  enableFilter,
  disableFilter,
  EmailFilter,
  FilterQuery,
  FilterAction,
  FiltersResponse,
  FilterResponse,
  FilterParams,
} from './filters';

// Advanced Settings
export {
  getAdvancedSettings,
  updateUploadSentMessages,
  getSMTPRelay,
  updateSMTPRelay,
  enableSMTPRelay,
  disableSMTPRelay,
  deleteSMTPRelay,
  SMTPRelay,
  AdvancedSettings,
} from './advanced-settings';
