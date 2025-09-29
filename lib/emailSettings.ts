// Simple in-memory storage for email settings
// In a real application, this would be stored in the database with user association

interface EmailSettings {
  emailAddress: string;
  emailAlerts: boolean;
  pushNotifications: boolean;
  useDefaultEmail: boolean;
  lowStockThreshold: number;
  updatedAt: string;
}

// In-memory storage (resets on server restart)
let userEmailSettings: EmailSettings | null = null;

export const emailSettings = {
  get(): EmailSettings | null {
    return userEmailSettings;
  },

  set(settings: EmailSettings): void {
    userEmailSettings = settings;
    console.log('Email settings updated:', settings);
  },

  clear(): void {
    userEmailSettings = null;
  },

  isConfigured(): boolean {
    return userEmailSettings !== null && userEmailSettings.emailAlerts;
  },

  getNotificationEmail(): string | null {
    if (this.isConfigured()) {
      if (userEmailSettings!.useDefaultEmail) {
        return process.env.DEFAULT_NOTIFICATION_EMAIL || null;
      } else {
        return userEmailSettings!.emailAddress || null;
      }
    }
    return null;
  }
};
