/**
 * Platform-agnostic navigation and UI state business logic
 */

import { MobileView, MediumView } from '../enums';

export interface NavigationState {
  // Mobile navigation
  mobileView: MobileView;
  
  // Medium screen navigation
  mediumView: MediumView;
  
  // Email selection
  selectedEmailId: string | null;
  selectedFolderId: string | null;
  selectedEmailAddressId: string | null;
  
  // UI states
  isSidebarOpen: boolean;
  isEmailListCollapsed: boolean;
  
  // Search state
  searchQuery: string;
  isSearchActive: boolean;
}

export interface NavigationOperations {
  /**
   * Get mobile screen title based on current view
   */
  getMobileTitle(view: MobileView, context: {
    selectedEmail?: { subject: string };
    selectedFolder?: { name: string };
  }): string;

  /**
   * Handle mobile back navigation
   */
  handleMobileBack(currentView: MobileView): MobileView;

  /**
   * Get next mobile view for forward navigation
   */
  getNextMobileView(currentView: MobileView, action: 'selectAddress' | 'selectFolder' | 'selectEmail'): MobileView;

  /**
   * Check if back button should be shown
   */
  shouldShowMobileBackButton(view: MobileView): boolean;

  /**
   * Get navigation breadcrumb
   */
  getBreadcrumb(state: NavigationState, context: {
    emailAddresses: Array<{ id: string; name: string }>;
    folders: Array<{ id: string; name: string }>;
    selectedEmail?: { subject: string };
  }): Array<{ label: string; view: MobileView; id?: string }>;

  /**
   * Determine if should show content in current view
   */
  shouldShowContent(view: MobileView, state: NavigationState): {
    showEmailAddresses: boolean;
    showFolders: boolean;
    showEmails: boolean;
    showEmailViewer: boolean;
  };
}

export class DefaultNavigationOperations implements NavigationOperations {
  getMobileTitle(view: MobileView, context: {
    selectedEmail?: { subject: string };
    selectedFolder?: { name: string };
  }): string {
    switch (view) {
      case MobileView.EMAIL_ADDRESSES:
        return 'Email Addresses';
      case MobileView.FOLDERS:
        return 'Mailboxes';
      case MobileView.EMAILS:
        return context.selectedFolder?.name || 'Emails';
      case MobileView.EMAIL_BODY:
        return context.selectedEmail?.subject || 'Email';
      default:
        return 'Mail';
    }
  }

  handleMobileBack(currentView: MobileView): MobileView {
    switch (currentView) {
      case MobileView.EMAIL_BODY:
        return MobileView.EMAILS;
      case MobileView.EMAILS:
        return MobileView.FOLDERS;
      case MobileView.FOLDERS:
        return MobileView.EMAIL_ADDRESSES;
      case MobileView.EMAIL_ADDRESSES:
      default:
        return MobileView.EMAIL_ADDRESSES;
    }
  }

  getNextMobileView(currentView: MobileView, action: 'selectAddress' | 'selectFolder' | 'selectEmail'): MobileView {
    switch (action) {
      case 'selectAddress':
        return MobileView.FOLDERS;
      case 'selectFolder':
        return MobileView.EMAILS;
      case 'selectEmail':
        return MobileView.EMAIL_BODY;
      default:
        return currentView;
    }
  }

  shouldShowMobileBackButton(view: MobileView): boolean {
    return view !== MobileView.EMAIL_ADDRESSES;
  }

  getBreadcrumb(state: NavigationState, context: {
    emailAddresses: Array<{ id: string; name: string }>;
    folders: Array<{ id: string; name: string }>;
    selectedEmail?: { subject: string };
  }): Array<{ label: string; view: MobileView; id?: string }> {
    const breadcrumb = [
      { label: 'Addresses', view: MobileView.EMAIL_ADDRESSES }
    ];

    if (state.selectedEmailAddressId) {
      const emailAddress = context.emailAddresses.find(addr => addr.id === state.selectedEmailAddressId);
      if (emailAddress) {
        breadcrumb.push({
          label: 'Folders',
          view: MobileView.FOLDERS
        });
      }
    }

    if (state.selectedFolderId) {
      const folder = context.folders.find(f => f.id === state.selectedFolderId);
      if (folder) {
        breadcrumb.push({
          label: folder.name,
          view: MobileView.EMAILS
        });
      }
    }

    if (state.selectedEmailId && context.selectedEmail) {
      breadcrumb.push({
        label: context.selectedEmail.subject,
        view: MobileView.EMAIL_BODY
      });
    }

    return breadcrumb;
  }

  shouldShowContent(view: MobileView, state: NavigationState): {
    showEmailAddresses: boolean;
    showFolders: boolean;
    showEmails: boolean;
    showEmailViewer: boolean;
  } {
    return {
      showEmailAddresses: view === MobileView.EMAIL_ADDRESSES,
      showFolders: view === MobileView.FOLDERS,
      showEmails: view === MobileView.EMAILS,
      showEmailViewer: view === MobileView.EMAIL_BODY
    };
  }
}

/**
 * Navigation state manager for handling complex navigation flows
 */
export class NavigationStateManager {
  private state: NavigationState;
  private operations: NavigationOperations;

  constructor(
    initialState: Partial<NavigationState> = {},
    operations: NavigationOperations = new DefaultNavigationOperations()
  ) {
    this.operations = operations;
    this.state = {
      mobileView: MobileView.EMAIL_ADDRESSES,
      mediumView: MediumView.LEFT,
      selectedEmailId: null,
      selectedFolderId: null,
      selectedEmailAddressId: null,
      isSidebarOpen: true,
      isEmailListCollapsed: false,
      searchQuery: '',
      isSearchActive: false,
      ...initialState
    };
  }

  getState(): NavigationState {
    return { ...this.state };
  }

  updateState(updates: Partial<NavigationState>): void {
    this.state = { ...this.state, ...updates };
  }

  // Convenience methods
  selectEmailAddress(emailAddressId: string): void {
    this.updateState({
      selectedEmailAddressId: emailAddressId,
      mobileView: this.operations.getNextMobileView(this.state.mobileView, 'selectAddress'),
      selectedFolderId: null,
      selectedEmailId: null
    });
  }

  selectFolder(folderId: string): void {
    this.updateState({
      selectedFolderId: folderId,
      mobileView: this.operations.getNextMobileView(this.state.mobileView, 'selectFolder'),
      selectedEmailId: null
    });
  }

  selectEmail(emailId: string): void {
    this.updateState({
      selectedEmailId: emailId,
      mobileView: this.operations.getNextMobileView(this.state.mobileView, 'selectEmail'),
      mediumView: MediumView.RIGHT
    });
  }

  goMobileBack(): void {
    const newView = this.operations.handleMobileBack(this.state.mobileView);
    
    const updates: Partial<NavigationState> = { mobileView: newView };
    
    // Clear selections based on navigation
    if (newView === MobileView.EMAILS) {
      updates.selectedEmailId = null;
    } else if (newView === MobileView.FOLDERS) {
      updates.selectedEmailId = null;
      updates.selectedFolderId = null;
    } else if (newView === MobileView.EMAIL_ADDRESSES) {
      updates.selectedEmailId = null;
      updates.selectedFolderId = null;
      updates.selectedEmailAddressId = null;
    }

    this.updateState(updates);
  }

  goMediumBack(): void {
    this.updateState({
      selectedEmailId: null,
      mediumView: MediumView.LEFT
    });
  }

  toggleSidebar(): void {
    this.updateState({
      isSidebarOpen: !this.state.isSidebarOpen
    });
  }

  toggleEmailListCollapse(): void {
    this.updateState({
      isEmailListCollapsed: !this.state.isEmailListCollapsed
    });
  }

  updateSearch(query: string, isActive: boolean): void {
    this.updateState({
      searchQuery: query,
      isSearchActive: isActive
    });
  }
}